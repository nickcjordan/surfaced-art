#!/usr/bin/env node
/**
 * Local security scanning script for Claude Code integration
 *
 * Usage:
 *   node scripts/security-scan.cjs              # Run all scans
 *   node scripts/security-scan.cjs --npm        # npm audit only
 *   node scripts/security-scan.cjs --trivy      # Trivy only
 *   node scripts/security-scan.cjs --semgrep    # Semgrep only
 *   node scripts/security-scan.cjs --dependabot # GitHub Dependabot alerts
 *   node scripts/security-scan.cjs --pr-reviews # Bot review comments on open PRs
 *
 * Output: JSON results to .security-reports/ directory
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, '..', '.security-reports');

// Ensure reports directory exists
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

function runNpmAudit() {
  console.log('Running npm audit...');
  try {
    const result = execSync('npm audit --json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const report = JSON.parse(result);
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'npm-audit.json'),
      JSON.stringify(report, null, 2)
    );
    return report;
  } catch (error) {
    // npm audit exits with non-zero if vulnerabilities found
    if (error.stdout) {
      const report = JSON.parse(error.stdout);
      fs.writeFileSync(
        path.join(REPORTS_DIR, 'npm-audit.json'),
        JSON.stringify(report, null, 2)
      );
      return report;
    }
    throw error;
  }
}

function runTrivyFs() {
  console.log('Running Trivy filesystem scan...');
  try {
    const result = execSync(
      'trivy fs . --format json --scanners vuln,secret,misconfig --severity CRITICAL,HIGH,MEDIUM',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const report = JSON.parse(result);
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'trivy-fs.json'),
      JSON.stringify(report, null, 2)
    );
    return report;
  } catch (error) {
    if (error.stdout) {
      try {
        const report = JSON.parse(error.stdout);
        fs.writeFileSync(
          path.join(REPORTS_DIR, 'trivy-fs.json'),
          JSON.stringify(report, null, 2)
        );
        return report;
      } catch {
        console.error('Trivy not installed or failed. Install with: choco install trivy');
        return null;
      }
    }
    console.error('Trivy not installed. Install with: choco install trivy');
    return null;
  }
}

function runTrivyIac() {
  console.log('Running Trivy IaC scan...');
  try {
    const result = execSync(
      'trivy config infrastructure/terraform --format json --severity CRITICAL,HIGH,MEDIUM',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const report = JSON.parse(result);
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'trivy-iac.json'),
      JSON.stringify(report, null, 2)
    );
    return report;
  } catch (error) {
    if (error.stdout) {
      try {
        const report = JSON.parse(error.stdout);
        fs.writeFileSync(
          path.join(REPORTS_DIR, 'trivy-iac.json'),
          JSON.stringify(report, null, 2)
        );
        return report;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function runSemgrep() {
  console.log('Running Semgrep scan...');
  try {
    const result = execSync(
      'semgrep scan --config auto --json',
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 50 * 1024 * 1024 }
    );
    const report = JSON.parse(result);
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'semgrep.json'),
      JSON.stringify(report, null, 2)
    );
    return report;
  } catch (error) {
    if (error.stdout) {
      try {
        const report = JSON.parse(error.stdout);
        fs.writeFileSync(
          path.join(REPORTS_DIR, 'semgrep.json'),
          JSON.stringify(report, null, 2)
        );
        return report;
      } catch {
        console.error('Semgrep not installed. Install with: pip install semgrep');
        return null;
      }
    }
    console.error('Semgrep not installed. Install with: pip install semgrep');
    return null;
  }
}

async function fetchDependabotAlerts() {
  console.log('Fetching Dependabot alerts from GitHub...');

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN or GH_TOKEN environment variable required');
    console.error('Create one at: https://github.com/settings/tokens');
    console.error('Required scope: security_events (for private repos)');
    return null;
  }

  // Get repo info from git remote
  let owner, repo;
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      owner = match[1];
      repo = match[2];
    }
  } catch {
    console.error('Could not determine GitHub repo from git remote');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/dependabot/alerts?state=open&per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const alerts = await response.json();
    fs.writeFileSync(
      path.join(REPORTS_DIR, 'dependabot.json'),
      JSON.stringify(alerts, null, 2)
    );
    return alerts;
  } catch (error) {
    console.error('Failed to fetch Dependabot alerts:', error.message);
    return null;
  }
}

async function fetchPrBotComments() {
  console.log('Fetching PR bot review comments from GitHub...');

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    // Fall back to gh CLI if no token
    try {
      execSync('gh auth status', { stdio: 'pipe' });
    } catch {
      console.error('No GITHUB_TOKEN and gh CLI not authenticated. Skipping PR reviews.');
      return null;
    }
  }

  // Get repo info from git remote
  let owner, repo;
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const match = remote.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) { owner = match[1]; repo = match[2]; }
  } catch {
    console.error('Could not determine GitHub repo from git remote');
    return null;
  }

  const headers = token
    ? { 'Accept': 'application/vnd.github+json', 'Authorization': `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' }
    : { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };

  // Known bot logins to collect suggestions from
  const BOT_LOGINS = ['sourcery-ai[bot]', 'github-actions[bot]', 'coderabbitai[bot]', 'dependabot[bot]'];

  try {
    // Get open PRs
    let prsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=100`;
    let prs = [];

    if (token) {
      const prsRes = await fetch(prsUrl, { headers });
      if (!prsRes.ok) { console.error(`GitHub API error fetching PRs: ${prsRes.status}`); return null; }
      prs = await prsRes.json();
    } else {
      const result = execSync(`gh api repos/${owner}/${repo}/pulls --paginate`, { encoding: 'utf-8' });
      prs = JSON.parse(result);
    }

    const prReviews = [];

    for (const pr of prs) {
      const prNumber = pr.number;
      let reviews = [], comments = [];

      if (token) {
        const [reviewsRes, commentsRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, { headers }),
          fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`, { headers }),
        ]);
        if (reviewsRes.ok) reviews = await reviewsRes.json();
        if (commentsRes.ok) comments = await commentsRes.json();
      } else {
        try {
          reviews = JSON.parse(execSync(`gh api repos/${owner}/${repo}/pulls/${prNumber}/reviews`, { encoding: 'utf-8' }));
          comments = JSON.parse(execSync(`gh api repos/${owner}/${repo}/pulls/${prNumber}/comments`, { encoding: 'utf-8' }));
        } catch { continue; }
      }

      // Filter to bot reviews
      const botReviews = reviews.filter(r => BOT_LOGINS.includes(r.user?.login));
      // Filter to bot inline comments, excluding ones already marked addressed
      const botComments = comments.filter(c =>
        BOT_LOGINS.includes(c.user?.login) &&
        !c.body?.includes('✅')
      );

      if (botReviews.length === 0 && botComments.length === 0) continue;

      prReviews.push({
        pr: prNumber,
        title: pr.title,
        url: pr.html_url,
        reviews: botReviews.map(r => ({
          bot: r.user.login,
          state: r.state,
          body: r.body,
          submitted_at: r.submitted_at,
        })),
        comments: botComments.map(c => ({
          bot: c.user.login,
          path: c.path,
          line: c.line,
          body: c.body,
          url: c.html_url,
        })),
      });
    }

    fs.writeFileSync(
      path.join(REPORTS_DIR, 'pr-reviews.json'),
      JSON.stringify(prReviews, null, 2)
    );
    return prReviews;
  } catch (error) {
    console.error('Failed to fetch PR bot comments:', error.message);
    return null;
  }
}

function summarizeFindings(npmReport, trivyFs, trivyIac, semgrepReport, dependabotAlerts) {
  const summary = {
    timestamp: new Date().toISOString(),
    npm: { critical: 0, high: 0, moderate: 0, low: 0, total: 0 },
    trivy: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    trivyIac: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    semgrep: { error: 0, warning: 0, info: 0, total: 0 },
    dependabot: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
    findings: []
  };

  // Parse npm audit
  if (npmReport?.vulnerabilities) {
    for (const [name, vuln] of Object.entries(npmReport.vulnerabilities)) {
      const sev = vuln.severity?.toLowerCase() || 'unknown';
      if (summary.npm[sev] !== undefined) summary.npm[sev]++;
      summary.npm.total++;
      summary.findings.push({
        source: 'npm',
        severity: sev,
        package: name,
        title: `Vulnerability in ${name}`,
        fixAvailable: vuln.fixAvailable ? 'yes' : 'no',
        via: Array.isArray(vuln.via) ? vuln.via.map(v => typeof v === 'string' ? v : v.title).join(', ') : ''
      });
    }
  }

  // Parse Trivy FS
  if (trivyFs?.Results) {
    for (const result of trivyFs.Results) {
      if (result.Vulnerabilities) {
        for (const vuln of result.Vulnerabilities) {
          const sev = vuln.Severity?.toLowerCase() || 'unknown';
          if (summary.trivy[sev] !== undefined) summary.trivy[sev]++;
          summary.trivy.total++;
          summary.findings.push({
            source: 'trivy',
            severity: sev,
            package: vuln.PkgName,
            title: vuln.Title || vuln.VulnerabilityID,
            fixedVersion: vuln.FixedVersion || 'none',
            cve: vuln.VulnerabilityID
          });
        }
      }
    }
  }

  // Parse Trivy IaC
  if (trivyIac?.Results) {
    for (const result of trivyIac.Results) {
      if (result.Misconfigurations) {
        for (const misconfig of result.Misconfigurations) {
          const sev = misconfig.Severity?.toLowerCase() || 'unknown';
          if (summary.trivyIac[sev] !== undefined) summary.trivyIac[sev]++;
          summary.trivyIac.total++;
          summary.findings.push({
            source: 'trivy-iac',
            severity: sev,
            file: result.Target,
            title: misconfig.Title,
            description: misconfig.Description,
            resolution: misconfig.Resolution
          });
        }
      }
    }
  }

  // Parse Semgrep
  if (semgrepReport?.results) {
    for (const result of semgrepReport.results) {
      const sev = result.extra?.severity?.toLowerCase() || 'warning';
      const sevKey = sev === 'error' ? 'error' : sev === 'info' ? 'info' : 'warning';
      summary.semgrep[sevKey]++;
      summary.semgrep.total++;
      summary.findings.push({
        source: 'semgrep',
        severity: sev,
        file: result.path,
        line: result.start?.line,
        title: result.check_id,
        message: result.extra?.message
      });
    }
  }

  // Parse Dependabot
  if (Array.isArray(dependabotAlerts)) {
    for (const alert of dependabotAlerts) {
      const sev = alert.security_advisory?.severity?.toLowerCase() || 'unknown';
      if (summary.dependabot[sev] !== undefined) summary.dependabot[sev]++;
      summary.dependabot.total++;
      summary.findings.push({
        source: 'dependabot',
        severity: sev,
        package: alert.dependency?.package?.name,
        title: alert.security_advisory?.summary,
        cve: alert.security_advisory?.cve_id,
        ghsa: alert.security_advisory?.ghsa_id,
        fixVersion: alert.security_vulnerability?.first_patched_version?.identifier
      });
    }
  }

  return summary;
}

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.length === 0;
  const runNpm = runAll || args.includes('--npm');
  const runTrivy = runAll || args.includes('--trivy');
  const runSemgrepFlag = runAll || args.includes('--semgrep');
  const runDependabot = runAll || args.includes('--dependabot');
  const runPrReviews = runAll || args.includes('--pr-reviews');

  let npmReport = null;
  let trivyFs = null;
  let trivyIac = null;
  let semgrepReport = null;
  let dependabotAlerts = null;
  let prReviews = null;

  if (runNpm) npmReport = runNpmAudit();
  if (runTrivy) {
    trivyFs = runTrivyFs();
    trivyIac = runTrivyIac();
  }
  if (runSemgrepFlag) semgrepReport = runSemgrep();
  if (runDependabot) dependabotAlerts = await fetchDependabotAlerts();
  if (runPrReviews) prReviews = await fetchPrBotComments();

  const summary = summarizeFindings(npmReport, trivyFs, trivyIac, semgrepReport, dependabotAlerts);

  fs.writeFileSync(
    path.join(REPORTS_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2)
  );

  // Print summary
  console.log('\n========== SECURITY SCAN SUMMARY ==========\n');
  console.log(`Timestamp: ${summary.timestamp}`);
  console.log(`\nnpm audit:     ${summary.npm.total} issues (${summary.npm.critical} critical, ${summary.npm.high} high)`);
  console.log(`Trivy FS:      ${summary.trivy.total} issues (${summary.trivy.critical} critical, ${summary.trivy.high} high)`);
  console.log(`Trivy IaC:     ${summary.trivyIac.total} issues (${summary.trivyIac.critical} critical, ${summary.trivyIac.high} high)`);
  console.log(`Semgrep:       ${summary.semgrep.total} issues (${summary.semgrep.error} errors, ${summary.semgrep.warning} warnings)`);
  console.log(`Dependabot:    ${summary.dependabot.total} alerts (${summary.dependabot.critical} critical, ${summary.dependabot.high} high)`);

  if (prReviews !== null) {
    const totalBotComments = prReviews.reduce((acc, pr) => acc + pr.comments.length, 0);
    console.log(`PR bot reviews: ${prReviews.length} PRs with bot feedback, ${totalBotComments} unaddressed inline comments`);
    for (const pr of prReviews) {
      console.log(`  PR #${pr.pr} (${pr.title}): ${pr.comments.length} comment(s)`);
    }
  }

  console.log(`\nReports saved to: ${REPORTS_DIR}/`);
  console.log('============================================\n');

  // Exit with error if critical issues found
  const hasCritical =
    summary.npm.critical > 0 ||
    summary.trivy.critical > 0 ||
    summary.trivyIac.critical > 0 ||
    summary.dependabot.critical > 0;

  if (hasCritical) {
    console.log('CRITICAL vulnerabilities found! Review reports for details.');
    process.exit(1);
  }
}

main().catch(console.error);
