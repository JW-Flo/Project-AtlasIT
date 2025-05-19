const { ConfluenceClient } = require('@atlassian/confluence');
const axios = require('axios');

// Initialize Confluence client
const confluence = new ConfluenceClient({
  host: process.env.CONFLUENCE_HOST,
  email: process.env.CONFLUENCE_EMAIL,
  token: process.env.CONFLUENCE_API_TOKEN
});

// Documentation Agent endpoint
const DOCS_ENDPOINT = 'https://docs.project-ignite.kd8jc7v8cd.workers.dev/docs';

async function syncToConfluence() {
  try {
    // 1. Get latest documentation from Documentation Agent
    const response = await axios.get(DOCS_ENDPOINT);
    const { doc } = response.data;

    // 2. Convert markdown to Confluence format
    const confluenceContent = convertToConfluenceFormat(doc);

    // 3. Update Confluence page
    await updateConfluencePage(confluenceContent);

    console.log('Documentation synced to Confluence successfully');
  } catch (error) {
    console.error('Error syncing to Confluence:', error);
    throw error;
  }
}

function convertToConfluenceFormat(markdown) {
  // Convert markdown to Confluence Storage Format
  // This is a simplified version - you'll need to handle all markdown elements
  return {
    version: { number: 1 },
    title: 'Project Ignite Documentation',
    type: 'page',
    body: {
      storage: {
        value: markdown,
        representation: 'storage'
      }
    }
  };
}

async function updateConfluencePage(content) {
  const pageId = process.env.CONFLUENCE_PAGE_ID;
  
  try {
    await confluence.content.updateContent({
      id: pageId,
      ...content
    });
  } catch (error) {
    console.error('Error updating Confluence page:', error);
    throw error;
  }
}

// Cloud Function entry point
exports.autoDoc = async (req, res) => {
  try {
    await syncToConfluence();
    res.status(200).send('Documentation synced to Confluence');
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
}; 