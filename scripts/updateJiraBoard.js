import fetch from 'node-fetch';

const JIRA_API_URL = 'https://flocasts.atlassian.net/rest/api/3';
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const JIRA_API_KEY = process.env.JIRA_API_KEY;
const JIRA_EMAIL = process.env.JIRA_EMAIL;

function getBasicAuthHeader() {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_KEY}`).toString('base64');
  return `Basic ${auth}`;
}

async function findOrCreateIssue(summary, details) {
  // Search for existing issue by summary
  const jql = `project = ${JIRA_PROJECT_KEY} AND summary ~ \"${summary}\" ORDER BY created DESC`;
  const searchRes = await fetch(`${JIRA_API_URL}/search?jql=${encodeURIComponent(jql)}`, {
    headers: {
      'Authorization': getBasicAuthHeader(),
      'Accept': 'application/json'
    }
  });
  const searchData = await searchRes.json();
  if (searchData.issues && searchData.issues.length > 0) {
    return searchData.issues[0].key;
  }
  // Create new issue
  const createRes = await fetch(`${JIRA_API_URL}/issue`, {
    method: 'POST',
    headers: {
      'Authorization': getBasicAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      fields: {
        project: { key: JIRA_PROJECT_KEY },
        summary,
        description: details,
        issuetype: { name: 'Task' }
      }
    })
  });
  const createData = await createRes.json();
  return createData.key;
}

async function addComment(issueKey, comment) {
  await fetch(`${JIRA_API_URL}/issue/${issueKey}/comment`, {
    method: 'POST',
    headers: {
      'Authorization': getBasicAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ body: comment })
  });
}

async function transitionIssue(issueKey, statusName = 'Done') {
  // Get available transitions
  const res = await fetch(`${JIRA_API_URL}/issue/${issueKey}/transitions`, {
    headers: {
      'Authorization': getBasicAuthHeader(),
      'Accept': 'application/json'
    }
  });
  const data = await res.json();
  const transition = data.transitions.find(t => t.name.toLowerCase() === statusName.toLowerCase());
  if (!transition) throw new Error(`No transition to status '${statusName}' found`);
  await fetch(`${JIRA_API_URL}/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: {
      'Authorization': getBasicAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ transition: { id: transition.id } })
  });
}

export async function updateJiraBoard({ summary, details, actor, confluenceUrl, changelogUrl }) {
  if (!JIRA_API_KEY || !JIRA_EMAIL || !JIRA_PROJECT_KEY) throw new Error('Missing required Jira env vars');
  const issueKey = await findOrCreateIssue(summary, details);
  const comment = `Deployment by ${actor}\nConfluence: ${confluenceUrl}\nChange Log: ${changelogUrl}`;
  await addComment(issueKey, comment);
  await transitionIssue(issueKey, 'Done');
  console.log(`Jira issue ${issueKey} updated.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [summary, details, actor, confluenceUrl, changelogUrl] = process.argv.slice(2);
  if (!summary || !details || !actor || !confluenceUrl || !changelogUrl) {
    console.error('Usage: node scripts/updateJiraBoard.js "summary" "details" "actor" "confluenceUrl" "changelogUrl"');
    process.exit(1);
  }
  updateJiraBoard({ summary, details, actor, confluenceUrl, changelogUrl }).catch(e => {
    console.error(e);
    process.exit(1);
  });
} 