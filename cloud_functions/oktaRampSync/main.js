// cloud_functions/oktaRampSync/main.js
// Cloud Function: Okta group membership -> Ramp role sync
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'
import fetch from 'node-fetch'

const secretClient = new SecretManagerServiceClient()
let rampApiTokenCache = null

async function getRampToken () {
  if (rampApiTokenCache) return rampApiTokenCache
  const [version] = await secretClient.accessSecretVersion({
    name: `projects/${process.env.GCP_PROJECT}/secrets/ramp_api_token/versions/latest`,
  })
  rampApiTokenCache = version.payload.data.toString()
  return rampApiTokenCache
}

const GROUP_TO_ROLE = {
  Ramp_Admins: 'Admin',
  Ramp_Bookkeepers: 'Bookkeeper',
  Ramp_IT_Admins: 'IT Admin',
}

export const oktaRampSync = async (req, res) => {
  // Verification challenge
  const challenge = req.get('X-Okta-Verification-Challenge')
  if (challenge) return res.status(200).send(challenge)

  const events = req.body.events || []
  const token = await getRampToken()

  await Promise.all(events.map(async (evt) => {
    const userTarget = evt.target.find(t => t.type === 'User')
    const groupTarget = evt.target.find(t => t.type === 'Group')
    if (!userTarget || !groupTarget) return

    const role = GROUP_TO_ROLE[groupTarget.displayName]
    if (!role) return

    const resp = await fetch('https://api.ramp.com/v1/roles/assign', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_email: userTarget.alternateId, role_id: role }),
    })

    if (!resp.ok) {
      const txt = await resp.text()
      console.error('Ramp API error:', resp.status, txt)
    }
  }))

  return res.status(200).send('OK')
} 