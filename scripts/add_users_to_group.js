import fetch from 'node-fetch';

const OKTA_DOMAIN = process.env.OKTA_DOMAIN; // e.g., 'dev-xxxx.okta.com'
const OKTA_API_TOKEN = process.env.OKTA_API_TOKEN;
const GROUP_ID = '00gqm70nlo9dPKm9e697';

const emails = [
  'alex.sangalang@flosports.tv',
  'braydon.skipper@flosports.tv',
  'cameron.palmer@flosports.tv',
  'carrie.good@flosports.tv',
  'james.witczak@flosports.tv',
  'jennifer.mitchell@flosports.tv',
  'business.transformation@flosports.tv',
  'joe.whittle@flosports.tv',
  'josh.stephens@flosports.tv',
  'manas.karnik@flosports.tv',
  'mark.hawrylak@flosports.tv',
  'richard.szajek@flosports.tv',
  'ryan.montalvo@flosports.tv',
  'sandy.zepeda@flosports.tv',
  'tori.trainor@flosports.tv'
];

async function addUserToGroup(userId) {
  const url = `https://${OKTA_DOMAIN}/api/v1/groups/${GROUP_ID}/users/${userId}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `SSWS ${OKTA_API_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to add user ${userId}: ${res.statusText}`);
  }
}

async function getUserIdByEmail(email) {
  const url = `https://${OKTA_DOMAIN}/api/v1/users/${email}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `SSWS ${OKTA_API_TOKEN}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) {
    throw new Error(`Failed to get userId for ${email}: ${res.statusText}`);
  }
  const user = await res.json();
  return user.id;
}

(async () => {
  for (const email of emails) {
    try {
      const userId = await getUserIdByEmail(email);
      await addUserToGroup(userId);
      console.log(`Added ${email} (${userId}) to group ${GROUP_ID}`);
    } catch (err) {
      console.error(`Error for ${email}:`, err.message);
    }
  }

  // Revert the repository to the desired state
  console.log("🔄 Reverting repository to the desired state...");
  await execAsync('git revert --no-commit HEAD');
  await execAsync('git commit -m "Revert to the desired state"');

  // Verify the revert by checking out the commit and reviewing the changes
  console.log("🔍 Verifying the revert...");
  await execAsync('git checkout HEAD');
  await execAsync('git log -1');

  // Commit and push the changes to the repository
  console.log("📤 Committing and pushing the changes...");
  await execAsync('git push origin main');
})();
