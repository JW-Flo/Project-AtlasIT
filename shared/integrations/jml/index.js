import google_workspace from "./google_workspace.js";
import microsoft_365 from "./microsoft_365.js";
import slack from "./slack.js";
import bamboohr from "./bamboohr.js";
import workday from "./workday.js";
import adp from "./adp.js";
import quickbooks from "./quickbooks.js";
import xero from "./xero.js";
import stripe from "./stripe.js";
import okta from "./okta.js";
import auth0 from "./auth0.js";
import crowdstrike from "./crowdstrike.js";
import aws from "./aws.js";
import gcp from "./gcp.js";
import azure from "./azure.js";
import zoom from "./zoom.js";
import teams from "./teams.js";
import discord from "./discord.js";

export const jmlCatalog = [
  google_workspace,
  microsoft_365,
  slack,
  bamboohr,
  workday,
  adp,
  quickbooks,
  xero,
  stripe,
  okta,
  auth0,
  crowdstrike,
  aws,
  gcp,
  azure,
  zoom,
  teams,
  discord,
];

export const jmlCatalogByApp = new Map(
  jmlCatalog.map((entry) => [entry.appId, entry]),
);
