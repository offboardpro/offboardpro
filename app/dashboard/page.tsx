"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  deleteUser, 
  GoogleAuthProvider, 
  reauthenticateWithPopup 
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  writeBatch,
  updateDoc,
  getDocs,
  serverTimestamp 
} from "firebase/firestore";

// --- PDF LIBRARIES ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 1. IMPORT TOOL INSTRUCTIONS
import { TOOL_INSTRUCTIONS } from "@/lib/tool-instructions";

// MASTER TOOL LIBRARY
// Keep tool names as stable strings because selected tools are stored in Firestore.
const TOOL_LIBRARY: Record<string, string[]> = {
  "Advertising & Paid Media": [
    "Google Ads",
    "Meta Business Manager",
    "Meta Ads Manager",
    "LinkedIn Campaign Manager",
    "TikTok Ads Manager",
    "Microsoft Advertising",
    "Pinterest Ads",
    "Snapchat Ads",
    "Reddit Ads",
    "Amazon Ads",
    "Apple Search Ads",
    "X Ads",
  ],

  "Analytics & Tracking": [
    "Google Analytics 4",
    "Google Tag Manager",
    "Google Search Console",
    "Looker Studio",
    "Microsoft Clarity",
    "Hotjar",
    "Mixpanel",
    "Amplitude",
    "Heap",
    "Matomo",
    "Plausible",
    "PostHog",
    "Segment",
  ],

  "SEO": [
    "Ahrefs",
    "Semrush",
    "Moz",
    "Ubersuggest",
    "Screaming Frog",
    "Surfer SEO",
    "Yoast SEO",
    "Rank Math",
    "Google Business Profile",
    "BrightLocal",
  ],

  "Social Media": [
    "Buffer",
    "Hootsuite",
    "Later",
    "Sprout Social",
    "SocialBee",
    "Metricool",
    "Loomly",
    "Planable",
    "Publer",
    "Agorapulse",
  ],

  "CRM & Sales": [
    "HubSpot",
    "Salesforce",
    "Pipedrive",
    "Zoho CRM",
    "Freshsales",
    "Close",
    "Copper",
    "Monday Sales CRM",
    "Apollo",
    "Intercom",
  ],

  "Project Management": [
    "ClickUp",
    "Asana",
    "Trello",
    "Monday.com",
    "Notion",
    "Jira",
    "Linear",
    "Basecamp",
    "Teamwork",
    "Wrike",
    "Todoist",
    "Airtable",
  ],

  "Communication": [
    "Slack",
    "Microsoft Teams",
    "Google Chat",
    "Discord",
    "Zoom",
    "Google Meet",
  ],

  "Files & Collaboration": [
    "Google Workspace",
    "Google Drive",
    "Dropbox",
    "Microsoft OneDrive",
    "Microsoft SharePoint",
    "Box",
  ],

  "Design & Creative": [
    "Figma",
    "Canva",
    "Adobe Creative Cloud",
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Adobe InDesign",
    "Adobe XD",
    "Sketch",
    "FigJam",
    "Miro",
    "Whimsical",
  ],

  "Website & CMS": [
    "WordPress",
    "Shopify",
    "WooCommerce",
    "Webflow",
    "Wix",
    "Squarespace",
    "Ghost",
    "Drupal",
    "HubSpot CMS",
    "Elementor",
    "Divi",
    "Framer",
  ],

  "Development": [
    "GitHub",
    "GitLab",
    "Bitbucket",
    "Vercel",
    "Netlify",
    "Firebase",
    "Supabase",
    "Render",
    "Railway",
    "Heroku",
    "Replit",
    "CodePen",
  ],

  "Hosting & Infrastructure": [
    "Hosting",
    "Microsoft 365",
    "AWS",
    "Google Cloud",
    "Microsoft Azure",
    "DigitalOcean",
    "Vultr",
    "Cloudflare",
    "cPanel",
    "Plesk",
    "Hostinger",
    "GoDaddy",
    "Namecheap",
    "SiteGround",
    "Bluehost",
  ],

  "Ecommerce & Payments": [
    "Stripe",
    "PayPal",
    "Razorpay",
    "Square",
    "Shopify Payments",
    "Klarna",
    "Payoneer",
    "Wise Business",
    "BigCommerce",
    "Magento",
  ],

  "Automation & Integrations": [
    "Zapier",
    "Make",
    "n8n",
    "Pipedream",
    "IFTTT",
    "Workato",
    "Microsoft Power Automate",
  ],

  "Email Marketing": [
    "Mailchimp",
    "Brevo",
    "Klaviyo",
    "ActiveCampaign",
    "Kit",
    "Drip",
    "Constant Contact",
    "Campaign Monitor",
    "MailerLite",
    "GetResponse",
  ],

  "Scheduling": [
    "Calendly",
    "Cal.com",
    "Acuity Scheduling",
    "Doodle",
    "Google Calendar",
    "Microsoft Outlook",
  ],

  "Time Tracking": [
    "Toggl Track",
    "Harvest",
    "Clockify",
    "Everhour",
    "Hubstaff",
    "Timely",
  ],

  "Video & Content": [
    "Loom",
    "Vimeo",
    "Wistia",
    "Descript",
    "Riverside",
    "Vidyard",
    "YouTube",
    "YouTube Studio",
    "CapCut",
    "Adobe Premiere Pro",
  ],

  "Documents & Signatures": [
    "DocuSign",
    "Adobe Acrobat",
    "Dropbox Sign",
    "PandaDoc",
    "Google Docs",
    "Microsoft Word",
  ],

  "Finance & Invoicing": [
    "QuickBooks",
    "Xero",
    "FreshBooks",
    "Wave",
    "Zoho Books",
  ],

  "Client Management & Agency Operations": [
    "Bonsai",
    "HoneyBook",
    "Dubsado",
    "Plutio",
    "Clientary",
    "SuiteDash",
    "Moxie",
  ],
};

// Flat list used by the existing selection/Firestore system.
const COMMON_TOOLS = Array.from(
  new Set(Object.values(TOOL_LIBRARY).flat())
);

// STEP 1 — Add the templates
const OFFBOARDING_TEMPLATES: Record<string, string[]> = {
  "Web Development": [
    "WordPress",
    "GitHub",
    "Vercel",
    "Google Analytics 4",
    "Google Tag Manager",
    "Cloudflare",
  ],

  "Digital Marketing": [
    "Google Ads",
    "Meta Business Manager",
    "Google Analytics 4",
    "Google Tag Manager",
    "Google Search Console",
    "Canva",
  ],

  "SEO": [
    "Google Search Console",
    "Google Analytics 4",
    "Ahrefs",
    "Semrush",
    "Google Business Profile",
  ],

  "Design": [
    "Figma",
    "Canva",
    "Adobe Creative Cloud",
    "Adobe Photoshop",
    "Adobe Illustrator",
  ],

  "Social Media": [
    "Meta Business Manager",
    "Meta Ads Manager",
    "Buffer",
    "Hootsuite",
    "Canva",
  ],

  "General": [],
};

const TOOL_CHECKLISTS: Record<string, string[]> = {
  // --- ADVERTISING & PAID MEDIA ---
  "Google Ads": [
    "Remove client/user access",
    "Remove manager account access",
  ],
  "Meta Business Manager": [
    "Remove client/user access",
    "Remove ad account access",
    "Remove Business Manager access",
  ],
  "Meta Ads Manager": [
    "Remove user access",
    "Remove ad account access",
    "Remove Page / Instagram access",
  ],
  "LinkedIn Campaign Manager": [
    "Remove user access",
    "Remove ad account access",
    "Remove LinkedIn Page access",
  ],
  "TikTok Ads Manager": [
    "Remove user access",
    "Remove ad account access",
    "Remove TikTok Business access",
  ],
  "Microsoft Advertising": [
    "Remove user access",
    "Remove advertising account access",
    "Remove manager account access",
  ],
  "Pinterest Ads": [
    "Remove user access",
    "Remove ad account access",
    "Remove business account access",
  ],
  "Snapchat Ads": [
    "Remove user access",
    "Remove ad account access",
    "Remove Business Manager access",
  ],
  "Reddit Ads": [
    "Remove user access",
    "Remove advertising account access",
  ],
  "Amazon Ads": [
    "Remove user access",
    "Remove advertising account access",
    "Remove marketplace / seller access if applicable",
  ],
  "Apple Search Ads": [
    "Remove user access",
    "Remove Search Ads account access",
  ],
  "X Ads": [
    "Remove user access",
    "Remove advertising account access",
  ],

  // --- ANALYTICS & TRACKING ---
  "Google Analytics 4": [
    "Remove client/user access",
    "Remove property access",
  ],
  "Google Tag Manager": [
    "Remove client/user access",
    "Remove container access",
  ],
  "Google Search Console": [
    "Remove client/user access",
    "Remove property access",
  ],
  "Looker Studio": [
    "Remove client/user access",
    "Remove report/data-source access",
  ],
  "Microsoft Clarity": [
    "Remove user access",
    "Remove project access",
  ],
  "Hotjar": [
    "Remove user access",
    "Remove site/project access",
  ],
  "Mixpanel": [
    "Remove user access",
    "Remove project access",
  ],
  "Amplitude": [
    "Remove user access",
    "Remove project access",
  ],
  "Heap": [
    "Remove user access",
    "Remove project access",
  ],
  "Matomo": [
    "Remove user access",
    "Remove site/property access",
  ],
  "Plausible": [
    "Remove user access",
    "Remove website access",
  ],
  "PostHog": [
    "Remove user access",
    "Remove project access",
  ],
  "Segment": [
    "Remove user access",
    "Remove workspace access",
    "Remove source/destination access",
  ],

  // --- SEO ---
  "Ahrefs": [
    "Remove user access",
    "Remove project access",
    "Remove shared workspace access",
  ],
  "Semrush": [
    "Remove user access",
    "Remove project access",
    "Remove shared workspace access",
  ],
  "Moz": [
    "Remove user access",
    "Remove campaign/project access",
  ],
  "Ubersuggest": [
    "Remove user access",
    "Remove project access",
  ],
  "Screaming Frog": [
    "Remove user access if applicable",
    "Remove stored client project/data access",
    "Remove shared license access if applicable",
  ],
  "Surfer SEO": [
    "Remove user access",
    "Remove content/project access",
  ],
  "Yoast SEO": [
    "Remove WordPress user access",
    "Remove admin/editor access",
  ],
  "Rank Math": [
    "Remove WordPress user access",
    "Remove admin/editor access",
  ],
  "Google Business Profile": [
    "Remove user/manager access",
    "Remove business profile access",
  ],
  "BrightLocal": [
    "Remove user access",
    "Remove client/location access",
  ],

  // --- SOCIAL MEDIA ---
  "Buffer": [
    "Remove user access",
    "Remove social account/channel access",
    "Remove workspace access",
  ],
  "Hootsuite": [
    "Remove user access",
    "Remove social profile access",
    "Remove organization/workspace access",
  ],
  "Later": [
    "Remove user access",
    "Remove social profile access",
    "Remove workspace access",
  ],
  "Sprout Social": [
    "Remove user access",
    "Remove social profile access",
    "Remove organization access",
  ],
  "SocialBee": [
    "Remove user access",
    "Remove social account access",
    "Remove workspace access",
  ],
  "Metricool": [
    "Remove user access",
    "Remove social profile access",
    "Remove workspace access",
  ],
  "Loomly": [
    "Remove user access",
    "Remove social account access",
    "Remove workspace access",
  ],
  "Planable": [
    "Remove user access",
    "Remove workspace access",
    "Remove social account access",
  ],
  "Publer": [
    "Remove user access",
    "Remove social account access",
    "Remove workspace access",
  ],
  "Agorapulse": [
    "Remove user access",
    "Remove social profile access",
    "Remove organization/workspace access",
  ],

  // --- CRM & SALES ---
  "HubSpot": [
    "Remove user access",
    "Remove CRM access",
    "Remove portal/team access",
  ],
  "Salesforce": [
    "Deactivate/remove user access",
    "Remove profile/permission access",
    "Remove account/team access",
  ],
  "Pipedrive": [
    "Remove user access",
    "Remove team/workspace access",
    "Remove shared pipeline access",
  ],
  "Zoho CRM": [
    "Remove user access",
    "Remove CRM/team access",
    "Remove role/permission access",
  ],
  "Freshsales": [
    "Remove user access",
    "Remove sales workspace access",
    "Remove team/role access",
  ],
  "Close": [
    "Remove user access",
    "Remove workspace access",
    "Remove shared pipeline access",
  ],
  "Copper": [
    "Remove user access",
    "Remove workspace access",
    "Remove shared CRM access",
  ],
  "Monday Sales CRM": [
    "Remove user access",
    "Remove board/workspace access",
    "Remove CRM permissions",
  ],
  "Apollo": [
    "Remove user access",
    "Remove workspace access",
    "Remove shared prospect/contact data access",
  ],
  "Intercom": [
    "Remove user access",
    "Remove workspace/team access",
    "Remove inbox/helpdesk access",
  ],

  // --- PROJECT MANAGEMENT ---
  ClickUp: [
    "Remove workspace access",
    "Remove project/list access",
  ],
  Asana: [
    "Remove workspace access",
    "Remove project access",
  ],
  "Trello": [
    "Remove user from workspace",
    "Remove board access",
    "Remove member access from shared boards",
  ],
  "Monday.com": [
    "Remove user from workspace",
    "Remove board access",
    "Remove team/member permissions",
  ],
  Notion: [
    "Remove workspace access",
    "Remove page/database access",
  ],
  "Jira": [
    "Remove user from organization",
    "Remove project access",
    "Remove project role/permissions",
  ],
  "Linear": [
    "Remove user from workspace",
    "Remove team access",
    "Remove project access",
  ],
  "Basecamp": [
    "Remove user from organization",
    "Remove project access",
    "Remove client/project permissions",
  ],
  "Teamwork": [
    "Remove user access",
    "Remove project access",
    "Remove team permissions",
  ],
  "Wrike": [
    "Remove user from workspace",
    "Remove folder/project access",
    "Remove team permissions",
  ],
  "Todoist": [
    "Remove user from workspace/team",
    "Remove shared project access",
  ],
  "Airtable": [
    "Remove user from workspace",
    "Remove base access",
    "Remove shared interface/access permissions",
  ],

  // --- COMMUNICATION ---
  "Microsoft Teams": [
    "Remove user from client team",
    "Remove shared channel access",
    "Remove guest access if applicable",
  ],
  "Google Chat": [
    "Remove user from client spaces",
    "Remove shared space access",
  ],
  "Discord": [
    "Remove user from client server",
    "Remove role/channel access",
  ],
  "Zoom": [
    "Remove user/account access",
    "Remove shared workspace access",
  ],
  "Google Meet": [
    "Remove shared meeting/resource access",
    "Remove related Google Workspace access if applicable",
  ],
  Slack: [
    "Remove from client workspace",
    "Remove shared channel access",
  ],

  // --- FILES & COLLABORATION ---
  "Google Workspace": [
    "Remove account/delegated access",
    "Remove shared resource access",
  ],
  "Google Drive": [
    "Remove shared drive access",
    "Remove shared file/folder access",
  ],
  "Dropbox": [
    "Remove user access",
    "Remove shared folder access",
    "Remove team/workspace access",
  ],
  "Microsoft OneDrive": [
    "Remove user access",
    "Remove shared file/folder access",
    "Remove shared resource access",
  ],
  "Microsoft SharePoint": [
    "Remove user/site access",
    "Remove site/library permissions",
    "Remove team/group membership",
  ],
  "Box": [
    "Remove user access",
    "Remove shared folder access",
    "Remove organization access",
  ],

  // --- DESIGN & CREATIVE ---
  "Figma": [
    "Remove team access",
    "Remove file/project access",
  ],
  "Canva": [
    "Remove team access",
    "Remove shared design access",
  ],
  "Adobe Creative Cloud": [
    "Remove user/license access",
    "Remove shared team access",
    "Remove client project/file access",
  ],
  "Adobe Photoshop": [
    "Remove shared file/project access",
    "Remove team/license access if applicable",
  ],
  "Adobe Illustrator": [
    "Remove shared file/project access",
    "Remove team/license access if applicable",
  ],
  "Adobe InDesign": [
    "Remove shared file/project access",
    "Remove team/license access if applicable",
  ],
  "Adobe XD": [
    "Remove shared file/project access",
    "Remove team/license access if applicable",
  ],
  "Sketch": [
    "Remove workspace access",
    "Remove shared document access",
  ],
  "Framer": [
    "Remove workspace access",
    "Remove project/site access",
  ],
  "FigJam": [
    "Remove team access",
    "Remove shared board access",
  ],
  "Miro": [
    "Remove user from team",
    "Remove board access",
    "Remove workspace access",
  ],
  "Whimsical": [
    "Remove workspace access",
    "Remove shared board/document access",
  ],

  // --- WEBSITE & CMS ---
  WordPress: [
    "Remove WordPress user account",
    "Remove admin/editor access",
  ],
  Shopify: [
    "Remove staff account",
    "Remove store access",
  ],
  WooCommerce: [
    "Remove WordPress user access",
    "Remove store/admin access",
    "Remove shared site access",
  ],
  Webflow: [
    "Remove workspace access",
    "Remove site/project access",
    "Remove collaborator access",
  ],
  Wix: [
    "Remove collaborator access",
    "Remove site access",
    "Remove role/permission access",
  ],
  Squarespace: [
    "Remove contributor access",
    "Remove website access",
    "Remove account permissions",
  ],
  Ghost: [
    "Remove staff/user access",
    "Remove publication access",
    "Remove administrator/editor permissions",
  ],
  Drupal: [
    "Remove user account",
    "Remove administrator/editor access",
    "Remove site/project access",
  ],
  "HubSpot CMS": [
    "Remove user access",
    "Remove CMS/content access",
    "Remove portal/team access",
  ],
  Elementor: [
    "Remove WordPress user access",
    "Remove website/editor access",
  ],
  Divi: [
    "Remove WordPress user access",
    "Remove website/editor access",
  ],

  // --- DEVELOPMENT ---
  GitHub: [
    "Remove organization membership",
    "Remove repository access",
    "Remove team/collaborator access",
  ],
  GitLab: [
    "Remove group membership",
    "Remove project/repository access",
    "Remove team/member permissions",
  ],
  Bitbucket: [
    "Remove workspace access",
    "Remove repository access",
    "Remove project permissions",
  ],
  Vercel: [
    "Remove team membership",
    "Remove project access",
    "Remove deployment/environment access",
  ],
  Netlify: [
    "Remove team membership",
    "Remove site access",
    "Remove deployment access",
  ],
  Firebase: [
    "Remove project access",
    "Remove IAM/team access",
    "Remove Firebase console access",
  ],
  Supabase: [
    "Remove organization/project access",
    "Remove team membership",
    "Remove database/project permissions",
  ],
  Render: [
    "Remove team membership",
    "Remove service/project access",
  ],
  Railway: [
    "Remove workspace membership",
    "Remove project access",
  ],
  Heroku: [
    "Remove team membership",
    "Remove app access",
    "Remove pipeline/resource access",
  ],
  Replit: [
    "Remove team/workspace access",
    "Remove project access",
  ],
  CodePen: [
    "Remove team/project access",
    "Remove shared asset access",
  ],

  // --- HOSTING & INFRASTRUCTURE ---
  "Hosting": [
    "Remove hosting account access",
    "Remove server/control-panel access",
  ],
  "Microsoft 365": [
    "Remove account/access",
    "Remove shared resource access",
  ],
  "AWS": [
    "Remove IAM/user access",
    "Remove console access",
  ],
  "Google Cloud": [
    "Remove user/IAM access",
    "Remove project access",
    "Remove service/resource access",
  ],
  "Microsoft Azure": [
    "Remove user access",
    "Remove subscription/resource access",
    "Remove role/permission access",
  ],
  "DigitalOcean": [
    "Remove team access",
    "Remove project access",
  ],
  "Vultr": [
    "Remove team/user access",
    "Remove project/server access",
  ],
  "Cloudflare": [
    "Remove member access",
    "Remove zone/domain access",
  ],
  "cPanel": [
    "Remove cPanel account access",
    "Remove FTP/file access",
  ],
  "Plesk": [
    "Remove user access",
    "Remove hosting/subscription access",
  ],
  "Hostinger": [
    "Remove account/team access",
    "Remove hosting access",
    "Remove domain access if applicable",
  ],
  "GoDaddy": [
    "Remove delegate access",
    "Remove domain/hosting access",
    "Remove account permissions",
  ],
  "Namecheap": [
    "Remove shared/delegate access",
    "Remove domain/hosting access",
  ],
  "SiteGround": [
    "Remove collaborator access",
    "Remove website/hosting access",
  ],
  "Bluehost": [
    "Remove account/user access",
    "Remove hosting/website access",
  ],

  // --- ECOMMERCE & PAYMENTS ---
  "Stripe": [
    "Remove team member access",
    "Remove account/dashboard access",
    "Remove developer/API access if applicable",
  ],
  "PayPal": [
    "Remove user/business account access",
    "Remove account permissions",
  ],
  "Razorpay": [
    "Remove team member access",
    "Remove dashboard/account access",
    "Remove API/key access if applicable",
  ],
  "Square": [
    "Remove team/member access",
    "Remove business/location access",
  ],
  "Shopify Payments": [
    "Remove staff access",
    "Remove payment/account access",
  ],
  "Klarna": [
    "Remove user/business access",
    "Remove merchant account access",
  ],
  "Payoneer": [
    "Remove user/business account access",
    "Remove shared account permissions",
  ],
  "Wise Business": [
    "Remove team member access",
    "Remove business account permissions",
  ],
  "BigCommerce": [
    "Remove user access",
    "Remove store/admin access",
    "Remove API access if applicable",
  ],
  "Magento": [
    "Remove admin/user account",
    "Remove store access",
    "Remove integration/API access if applicable",
  ],

  // --- AUTOMATION & INTEGRATIONS ---
  "Zapier": [
    "Remove user/team access",
    "Remove shared workspace access",
    "Review and remove client-related connections",
  ],
  "Make": [
    "Remove user/team access",
    "Remove organization/workspace access",
    "Review and remove client-related connections",
  ],
  "n8n": [
    "Remove user/team access",
    "Remove workspace/project access",
    "Review client-related workflows and credentials",
  ],
  "Pipedream": [
    "Remove user/team access",
    "Remove project/workspace access",
    "Review client-related integrations and credentials",
  ],
  "IFTTT": [
    "Remove user/account access",
    "Review and remove client-related app connections",
  ],
  "Workato": [
    "Remove user/team access",
    "Remove workspace access",
    "Review client-related connections and recipes",
  ],
  "Microsoft Power Automate": [
    "Remove user access",
    "Remove environment/flow access",
    "Review client-related connections",
  ],

  // --- EMAIL MARKETING ---
  "Mailchimp": [
    "Remove user access",
    "Remove audience/list access",
    "Remove account/team permissions",
  ],
  "Brevo": [
    "Remove user access",
    "Remove account/workspace access",
    "Review client-related integrations",
  ],
  "Klaviyo": [
    "Remove user access",
    "Remove account/store access",
    "Remove shared project permissions",
  ],
  "ActiveCampaign": [
    "Remove user access",
    "Remove account access",
    "Review client-related integrations",
  ],
  "Kit": [
    "Remove user access",
    "Remove creator/account access",
    "Review client-related integrations",
  ],
  "Drip": [
    "Remove user access",
    "Remove account access",
    "Review client-related integrations",
  ],
  "Constant Contact": [
    "Remove user access",
    "Remove account/list access",
  ],
  "Campaign Monitor": [
    "Remove user access",
    "Remove account/list access",
  ],
  "MailerLite": [
    "Remove user access",
    "Remove account/workspace access",
  ],
  "GetResponse": [
    "Remove user access",
    "Remove account/list access",
  ],

  // --- SCHEDULING ---
  "Calendly": [
    "Remove user access",
    "Remove team/workspace access",
    "Remove shared event/workflow access",
  ],
  "Cal.com": [
    "Remove user access",
    "Remove organization/team access",
    "Remove shared booking configuration access",
  ],
  "Acuity Scheduling": [
    "Remove user access",
    "Remove scheduling account access",
    "Review client-related calendars and integrations",
  ],
  "Doodle": [
    "Remove user access",
    "Remove shared team access",
  ],
  "Google Calendar": [
    "Remove shared calendar access",
    "Remove delegated calendar access",
    "Remove client-related sharing permissions",
  ],
  "Microsoft Outlook": [
    "Remove shared calendar/mailbox access",
    "Remove delegated access",
    "Remove client-related permissions",
  ],

  // --- TIME TRACKING ---
  "Toggl Track": [
    "Remove user access",
    "Remove workspace/project access",
    "Remove client/project data access",
  ],
  "Harvest": [
    "Remove user access",
    "Remove team/workspace access",
    "Remove client/project access",
  ],
  "Clockify": [
    "Remove user access",
    "Remove workspace access",
    "Remove project/client access",
  ],
  "Everhour": [
    "Remove user access",
    "Remove workspace/team access",
    "Remove project access",
  ],
  "Hubstaff": [
    "Remove user access",
    "Remove team/workspace access",
    "Remove project/client access",
  ],
  "Timely": [
    "Remove user access",
    "Remove workspace/team access",
    "Remove client/project access",
  ],

  // --- VIDEO & CONTENT ---
  "Loom": [
    "Remove user access",
    "Remove workspace access",
    "Review and remove client-related recordings if required",
  ],
  "Vimeo": [
    "Remove user/team access",
    "Remove project/video access",
    "Review shared client content",
  ],
  "Wistia": [
    "Remove user access",
    "Remove workspace/project access",
    "Review shared client media",
  ],
  "Descript": [
    "Remove user/workspace access",
    "Remove project access",
    "Review shared client media",
  ],
  "Riverside": [
    "Remove user/team access",
    "Remove workspace/project access",
    "Review shared client recordings",
  ],
  "Vidyard": [
    "Remove user access",
    "Remove workspace/team access",
    "Review shared client content",
  ],
  "YouTube": [
    "Remove channel/Brand Account access",
    "Remove manager/editor permissions",
    "Review shared channel resources",
  ],
  "YouTube Studio": [
    "Remove channel access",
    "Remove manager/editor permissions",
    "Review shared channel resources",
  ],
  "CapCut": [
    "Remove team/workspace access",
    "Remove shared project access",
    "Review client project files",
  ],
  "Adobe Premiere Pro": [
    "Remove shared project access",
    "Remove team/license access if applicable",
    "Review client media/project files",
  ],

  // --- DOCUMENTS & SIGNATURES ---
  "DocuSign": [
    "Remove user access",
    "Remove shared account/team access",
    "Review client documents and permissions",
  ],
  "Adobe Acrobat": [
    "Remove user/team access",
    "Remove shared document access",
    "Review client files and permissions",
  ],
  "Dropbox Sign": [
    "Remove user access",
    "Remove team/workspace access",
    "Review client documents and permissions",
  ],
  "PandaDoc": [
    "Remove user access",
    "Remove workspace/team access",
    "Review client documents and templates",
  ],
  "Google Docs": [
    "Remove shared document access",
    "Remove shared folder/Drive access",
    "Review client document permissions",
  ],
  "Microsoft Word": [
    "Remove shared document access",
    "Remove shared OneDrive/SharePoint access",
    "Review client document permissions",
  ],

  // --- FINANCE & INVOICING ---
  "QuickBooks": [
    "Remove user/account access",
    "Remove company file access",
    "Review client financial data permissions",
  ],
  "Xero": [
    "Remove user access",
    "Remove organization/company access",
    "Review financial data permissions",
  ],
  "FreshBooks": [
    "Remove user access",
    "Remove client/account access",
    "Review shared financial data",
  ],
  "Wave": [
    "Remove user access",
    "Remove business/account access",
    "Review financial data permissions",
  ],
  "Zoho Books": [
    "Remove user access",
    "Remove organization access",
    "Review role and financial permissions",
  ],

  // --- CLIENT MANAGEMENT & AGENCY OPERATIONS ---
  "Bonsai": [
    "Remove user/team access",
    "Remove client/project access",
    "Review shared contracts, invoices and documents",
  ],
  "HoneyBook": [
    "Remove user/team access",
    "Remove workspace/client access",
    "Review shared projects, files and financial data",
  ],
  "Dubsado": [
    "Remove user access",
    "Remove workspace/client access",
    "Review shared projects, forms and documents",
  ],
  "Plutio": [
    "Remove user/team access",
    "Remove workspace/project access",
    "Review shared client data",
  ],
  "Clientary": [
    "Remove user/team access",
    "Remove client/project access",
    "Review shared client data and documents",
  ],
  "SuiteDash": [
    "Remove user/team access",
    "Remove client portal/project access",
    "Review shared client data and files",
  ],
  "Moxie": [
    "Remove user/team access",
    "Remove client/project access",
    "Review shared contracts, invoices and documents",
  ],
};

// --- CLIENT STATUS HELPERS ---
const getClientStatusLabel = (status?: string) => {
  switch (status) {
    case "ending_soon":
      return "Ending Soon";
    case "offboarding":
      return "Offboarding";
    case "ready_to_close":
      return "Ready to Close";
    case "closed":
      return "Closed";
    default:
      return "Active";
  }
};

const getClientStatusClasses = (status?: string) => {
  switch (status) {
    case "ending_soon":
      return "bg-[#9BCB3B]/10 text-[#6d941f] border-[#9BCB3B]/30";
    case "offboarding":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "ready_to_close":
      return "bg-[#9BCB3B]/10 text-[#6d941f] border-[#9BCB3B]/30";
    case "closed":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); 
  const [viewingSubscription, setViewingSubscription] = useState(false); 
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [isPro, setIsPro] = useState(false); 
  const [isDarkMode, setIsDarkMode] = useState(false); 
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [subscriptionData, setSubscriptionData] = useState<any>(null); 
  
  // 2. STATE FOR INSTRUCTIONS TASK
  const [instructionTask, setInstructionTask] = useState<any>(null);

  // 6B. STATE FOR ACTIVITY MODAL
  const [activityClient, setActivityClient] = useState<any>(null);

  // FORM STATES
  const [clientName, setClientName] = useState("");
  const [clientStatus, setClientStatus] = useState("active");
  const [projectName, setProjectName] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  // STEP 2 — Add template state
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [accessRemovalDeadline, setAccessRemovalDeadline] = useState("");
  const [accessReviewDate, setAccessReviewDate] = useState("");
  const [notes, setNotes] = useState("");
  
  // TOOL SEARCH & CATEGORY FILTER STATES
  const [toolSearch, setToolSearch] = useState("");
  const [activeToolCategory, setActiveToolCategory] = useState("All");

  // Toggle state for Email Reminders
  const [emailEnabled, setEmailEnabled] = useState(true);

  const [clients, setClients] = useState<any[]>([]);

  // STEP 1 — Completion Summary State
  const [completionSummaryClient, setCompletionSummaryClient] = useState<any>(null);

  // STEP 1 — Add Activity Timeline data helper
  const addActivityLog = async (
    clientId: string,
    activity: {
      type: string;
      message: string;
      taskId?: string;
      taskTitle?: string;
      tool?: string;
      actor?: string;
    }
  ) => {
    try {
      const client = clients.find((item) => item.id === clientId);
      if (!client) return;

      const existingLog = Array.isArray(client.activityLog)
        ? client.activityLog
        : [];

      const newEntry = {
        id: crypto.randomUUID(),
        type: activity.type,
        message: activity.message,
        taskId: activity.taskId || null,
        taskTitle: activity.taskTitle || null,
        tool: activity.tool || null,
        actor: activity.actor || user?.displayName || "You",
        timestamp: new Date().toISOString(),
      };

      await updateDoc(doc(db, "clients", clientId), {
        activityLog: [newEntry, ...existingLog].slice(0, 100),
      });
    } catch (error) {
      console.error("Failed to add activity log:", error);
    }
  };

  // Safely extract instruction object for current instructionTask
  const currentInstruction = useMemo(() => {
    return instructionTask ? TOOL_INSTRUCTIONS[instructionTask.tool] : null;
  }, [instructionTask]);

  // Helper function to safely display tools whether stored as string or array
  const formatToolsDisplay = (toolsData: any) => {
    if (Array.isArray(toolsData)) {
      return toolsData.join(", ");
    }
    return toolsData || "";
  };

  // 3. INSTRUCTION OPENER HELPER
  const openToolInstructions = (task: any) => {
    setInstructionTask(task);
  };

  // TOOL TOGGLE FUNCTION
  const toggleTool = (tool: string) => {
    setTools((current) =>
      current.includes(tool)
        ? current.filter((item) => item !== tool)
        : [...current, tool]
    );
  };

  // STEP 3 — Add the template selection function
  const applyOffboardingTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);

    const templateTools = OFFBOARDING_TEMPLATES[templateName] || [];

    setTools((current) =>
      Array.from(new Set([...current, ...templateTools]))
    );
  };

  // --- SMART ACCESS ALERTS ---
  const activeAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients.filter((client) => {
      // Closed clients should never appear in active access alerts.
      if (client.clientStatus === "closed") {
        return false;
      }

      const deadline = client.accessRemovalDeadline
        ? new Date(client.accessRemovalDeadline)
        : null;

      if (!deadline) {
        return false;
      }

      deadline.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (deadline.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const checklist = Array.isArray(client.checklist)
        ? client.checklist
        : [];

      const completedTasks = checklist.filter(
        (task: any) =>
          task.status === "removed" ||
          task.status === "not_needed"
      ).length;

      const progress =
        checklist.length > 0
          ? Math.round((completedTasks / checklist.length) * 100)
          : 0;

      // Alert when access removal is due within 2 days
      // or already overdue, as long as work is incomplete.
      return diffDays <= 2 && progress < 100;
    });
  }, [clients]);

  // --- NEEDS YOUR ATTENTION ---
  const attentionItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients
      .filter((client) => client.clientStatus !== "closed")
      .map((client) => {
        const checklist = Array.isArray(client.checklist)
          ? client.checklist
          : [];

        const totalTasks = checklist.length;
        const completedTasks = checklist.filter(
          (task: any) =>
            task.status === "removed" ||
            task.status === "not_needed"
        ).length;

        const progress =
          totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        const deadlineDate = client.accessRemovalDeadline
          ? new Date(client.accessRemovalDeadline)
          : null;

        if (
          (client.clientStatus === "offboarding" ||
            client.clientStatus === "ready_to_close") &&
          deadlineDate &&
          deadlineDate < today &&
          progress < 100
        ) {
          return {
            ...client,
            attentionType: "overdue",
            attentionLabel: "Overdue",
            attentionText: "Access removal deadline has passed.",
            priority: 1,
          };
        }

        if (client.clientStatus === "ready_to_close") {
          return {
            ...client,
            attentionType: "ready",
            attentionLabel: "Ready to Close",
            attentionText: "All offboarding tasks are complete.",
            priority: 2,
          };
        }

        if (client.clientStatus === "offboarding") {
          return {
            ...client,
            attentionType: "offboarding",
            attentionLabel: "Offboarding",
            attentionText:
              progress > 0
                ? `${progress}% of offboarding tasks complete.`
                : "Offboarding has started.",
            priority: 3,
          };
        }

        if (client.clientStatus === "ending_soon") {
          return {
            ...client,
            attentionType: "ending",
            attentionLabel: "Ending Soon",
            attentionText: "Project end date is approaching.",
            priority: 4,
          };
        }

        return null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.priority - b.priority);
  }, [clients]);

  // --- DYNAMIC SECURITY RATING CALCULATION ---
  const securityMetrics = useMemo(() => {
    if (clients.length === 0) {
      return { score: "NOT RATED", color: "#94a3b8" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueRisks = clients.filter((client) => {
      if (
        client.clientStatus !== "offboarding" &&
        client.clientStatus !== "ready_to_close"
      ) {
        return false;
      }

      const checklist = Array.isArray(client.checklist)
        ? client.checklist
        : [];

      const totalTasks = checklist.length;

      const completedTasks = checklist.filter(
        (task: any) =>
          task.status === "removed" ||
          task.status === "not_needed"
      ).length;

      const progress =
        totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0;

      const deadlineDate = client.accessRemovalDeadline
        ? new Date(client.accessRemovalDeadline)
        : null;

      return (
        deadlineDate !== null &&
        deadlineDate < today &&
        progress < 100
      );
    });

    if (overdueRisks.length === 0) {
      return { score: "SECURED", color: "#9BCB3B" };
    }

    if (overdueRisks.length === 1) {
      return { score: "WARNING", color: "#facc15" };
    }

    return { score: "AT RISK", color: "#ef4444" };
  }, [clients]);

  useEffect(() => {
    const emergencyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace("/");
      } else {
        setUser(currentUser);

        const userRef = doc(db, "users", currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const firestoreIsPro = data.isPro || false;
            const expiryDate = data.expiresAt?.toDate(); 
            
            setSubscriptionData({
                expiry: expiryDate ? expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
                plan: firestoreIsPro ? "Professional" : "Free Starter"
            });

            const today = new Date();

            if (firestoreIsPro && expiryDate && today > expiryDate) {
              setIsPro(false);
              updateDoc(userRef, { isPro: false });
            } else {
              setIsPro(firestoreIsPro);
            }
          } else {
            setIsPro(false);
          }
          setLoading(false); 
          clearTimeout(emergencyTimer);
        }, (error) => {
          console.error("User sync error:", error);
          setLoading(false); 
        });

        const q = query(
          collection(db, "clients"), 
          where("userId", "==", currentUser.uid)
        );

        const unsubscribeData = onSnapshot(q, (snapshot) => {
          const clientData = snapshot.docs.map((doc) => {
            const client = {
              id: doc.id,
              ...doc.data(),
            } as any;

            const currentStatus = client.clientStatus || "active";

            // Never automatically change a closed client.
            if (currentStatus === "closed") {
              return client;
            }

            // Once offboarding has started, determine whether it is ready to close.
            if (
              currentStatus === "offboarding" &&
              Array.isArray(client.checklist)
            ) {
              const allComplete =
                client.checklist.length > 0 &&
                client.checklist.every(
                  (task: any) =>
                    task.status === "removed" ||
                    task.status === "not_needed"
                );

              return {
                ...client,
                clientStatus: allComplete
                  ? "ready_to_close"
                  : "offboarding",
              };
            }

            // Ending Soon is based on the project end date.
            if (client.projectEndDate && currentStatus !== "offboarding" && currentStatus !== "ready_to_close") {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const endDate = new Date(client.projectEndDate);
              endDate.setHours(0, 0, 0, 0);

              const diffDays = Math.ceil(
                (endDate.getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              if (diffDays >= 0 && diffDays <= 7) {
                return {
                  ...client,
                  clientStatus: "ending_soon",
                };
              }
            }

            return {
              ...client,
              clientStatus: currentStatus,
            };
          });

          setClients(clientData);
        });

        return () => {
          unsubscribeUser();
          unsubscribeData();
        };
      }
    });

    return () => {
      unsubscribeAuth();
      clearTimeout(emergencyTimer);
    };
  }, [router]);

  const generatePDF = () => {
    if (!isPro) return;
    const docPdf = new jsPDF();
    docPdf.setFontSize(18);
    docPdf.text("Security Offboarding Report", 14, 20);
    docPdf.setFontSize(10);
    docPdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    autoTable(docPdf, {
      startY: 35,
      head: [['Client Name', 'Tools/Access', 'Review Date', 'Status']],
      body: filteredClients.map(c => [
        c.name, 
        formatToolsDisplay(c.tools), 
        c.date, 
        c.status === 'completed' ? 'SECURED' : 'PENDING'
      ]),
      headStyles: { fillColor: [36, 63, 116] },
    });
    
    docPdf.save(`OffboardPro_Report_${new Date().getTime()}.pdf`);
  };

  const exportCSV = () => {
    if (!isPro) return;
    const headers = ["Client Name", "Tools", "Review Date", "Status", "Notes"];
    const csvData = filteredClients.map(c => [
      c.name,
      formatToolsDisplay(c.tools),
      c.date,
      c.status,
      c.notes || ""
    ]);

    const content = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "offboarding_data.csv");
    link.click();
  };

  const handleBulkDelete = async () => {
    if (!isPro || clients.length === 0) return;
    const confirmBulk = confirm("Are you sure you want to delete ALL clients? This cannot be undone.");
    if (confirmBulk) {
      try {
        const batch = writeBatch(db);
        clients.forEach((client) => {
          batch.delete(doc(db, "clients", client.id));
        });
        await batch.commit();
        alert("All data cleared successfully.");
      } catch (e) {
        console.error("Bulk delete error", e);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmDelete = confirm("CRITICAL: This will permanently wipe your account and all projects. This cannot be undone. Proceed?");
    
    if (confirmDelete) {
      try {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
        
        const q = query(collection(db, "clients"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => batch.delete(doc.ref));
        
        batch.delete(doc(db, "users", user.uid));
        await batch.commit();

        await deleteUser(user);
        router.push("/");
      } catch (error: any) {
        console.error(error);
        if (error.code === "auth/requires-recent-login") {
           alert("Session expired. Please log out and log back in to verify your identity for deletion.");
        } else {
           alert("Account deletion failed. Please try again later.");
        }
        setLoading(false);
      }
    }
  };

  // STEP 2 — Log when offboarding starts
  const startOffboarding = async (id: string) => {
    try {
      const client = clients.find((item) => item.id === id);

      if (!client) {
        alert("Client not found.");
        return;
      }

      const selectedTools = Array.isArray(client.tools)
        ? client.tools
        : typeof client.tools === "string" && client.tools.trim()
          ? client.tools
              .split(",")
              .map((tool: string) => tool.trim())
              .filter(Boolean)
          : [];

      const checklist = selectedTools.flatMap((tool: string) => {
        const tasks = TOOL_CHECKLISTS[tool] || [
          `Remove access from ${tool}`,
        ];

        return tasks.map((task: string) => ({
          id: crypto.randomUUID(),
          title: task,
          tool,
          status: "pending",
        }));
      });

      await updateDoc(doc(db, "clients", id), {
        clientStatus: "offboarding",
        offboardingStartedAt: serverTimestamp(),
        checklist,
      });

      await addActivityLog(id, {
        type: "offboarding_started",
        message: "Offboarding started",
      });
    } catch (error) {
      console.error("Failed to start offboarding:", error);
      alert("Failed to start offboarding. Please try again.");
    }
  };

  // STEP 3 — Log task status changes
  const updateChecklistTask = async (
    clientId: string,
    taskId: string,
    newStatus: string
  ) => {
    try {
      const client = clients.find((item) => item.id === clientId);

      if (!client || !Array.isArray(client.checklist)) {
        return;
      }

      const updatedChecklist = client.checklist.map((task: any) =>
        task.id === taskId
          ? { ...task, status: newStatus }
          : task
      );

      await updateDoc(doc(db, "clients", clientId), {
        checklist: updatedChecklist,
      });

      const changedTask = client.checklist.find(
        (task: any) => task.id === taskId
      );
      if (changedTask) {
        await addActivityLog(clientId, {
          type: "task_status_changed",
          message: `Task marked ${newStatus.replace("_", " ")}`,
          taskId,
          taskTitle: changedTask.title,
          tool: changedTask.tool,
        });
      }
    } catch (error) {
      console.error("Failed to update checklist task:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  // STEP 4 — Log assignments
  const assignChecklistTask = async (
    clientId: string,
    taskId: string
  ) => {
    if (!isPro) return;

    const client = clients.find((item) => item.id === clientId);

    if (!client || !Array.isArray(client.checklist)) {
      return;
    }

    const task = client.checklist.find((item: any) => item.id === taskId);

    if (!task) return;

    const currentAssignee = task.assignee || "";

    const assignee = window
      .prompt(
        "Assign this task to a team member (name or email):",
        currentAssignee
      )
      ?.trim();

    if (assignee === undefined) return;

    try {
      const updatedChecklist = client.checklist.map((item: any) =>
        item.id === taskId
          ? {
              ...item,
              assignee: assignee || null,
            }
          : item
      );

      await updateDoc(doc(db, "clients", clientId), {
        checklist: updatedChecklist,
      });

      await addActivityLog(clientId, {
        type: "task_assigned",
        message: assignee
          ? `Task assigned to ${assignee}`
          : "Task assignment removed",
        taskId,
        taskTitle: task.title,
        tool: task.tool,
        actor: user?.displayName || "You",
      });
    } catch (error) {
      console.error("Failed to assign checklist task:", error);
      alert("Failed to assign task. Please try again.");
    }
  };

  // STEP 5 — Log client closure
  const closeClient = async (clientId: string) => {
    try {
      const client = clients.find((item) => item.id === clientId);

      if (!client) return;

      const checklist = Array.isArray(client.checklist)
        ? client.checklist
        : [];

      const incompleteTasks = checklist.filter(
        (task: any) =>
          task.status !== "removed" &&
          task.status !== "not_needed"
      );

      if (incompleteTasks.length > 0) {
        const shouldClose = window.confirm(
          `${incompleteTasks.length} offboarding task${
            incompleteTasks.length === 1 ? "" : "s"
          } still need attention.\n\nAre you sure you want to close this client anyway?`
        );

        if (!shouldClose) return;
      }

      let closeReason = "";

      if (incompleteTasks.length > 0) {
        closeReason =
          window.prompt(
            "Why are you closing this client with incomplete tasks?"
          )?.trim() || "";

        if (!closeReason) {
          alert("Please provide a reason before closing the client.");
          return;
        }
      }

      const removedTasks = checklist.filter(
        (task: any) => task.status === "removed"
      ).length;

      const notNeededTasks = checklist.filter(
        (task: any) => task.status === "not_needed"
      ).length;

      const assignees = Array.from(
        new Set(
          checklist
            .map((task: any) => task.assignee)
            .filter(Boolean)
        )
      );

      await updateDoc(doc(db, "clients", clientId), {
        clientStatus: "closed",
        closedAt: serverTimestamp(),
        closeReason,

        completionSnapshot: {
          clientName: client.name || "",
          projectName: client.projectName || "",
          tools: Array.isArray(client.tools)
            ? client.tools
            : [],
          totalTasks: checklist.length,
          removedTasks,
          notNeededTasks,
          incompleteTasks: incompleteTasks.length,
          assignees,
        },
      });

      await addActivityLog(clientId, {
        type: "client_closed",
        message: "Client offboarding closed",
        actor: user?.displayName || "You",
      });

      setCompletionSummaryClient({
        ...client,
        clientStatus: "closed",
        closeReason,
        completionSnapshot: {
          clientName: client.name || "",
          projectName: client.projectName || "",
          tools: Array.isArray(client.tools)
            ? client.tools
            : [],
          totalTasks: checklist.length,
          removedTasks,
          notNeededTasks,
          incompleteTasks: incompleteTasks.length,
          assignees,
        },
      });
    } catch (error) {
      console.error("Failed to close client:", error);
      alert("Failed to close client. Please try again.");
    }
  };

  // STEP 3 — Summary Opener Helper
  const openCompletionSummary = (client: any) => {
    const checklist = Array.isArray(client.checklist)
      ? client.checklist
      : [];

    const removedTasks = checklist.filter(
      (task: any) => task.status === "removed"
    ).length;

    const notNeededTasks = checklist.filter(
      (task: any) => task.status === "not_needed"
    ).length;

    const incompleteTasks = checklist.filter(
      (task: any) =>
        task.status !== "removed" &&
        task.status !== "not_needed"
    ).length;

    const assignees = Array.from(
      new Set(
        checklist
          .map((task: any) => task.assignee)
          .filter(Boolean)
      )
    );

    setCompletionSummaryClient({
      ...client,
      completionSnapshot: client.completionSnapshot || {
        clientName: client.name || "",
        projectName: client.projectName || "",
        tools: Array.isArray(client.tools)
          ? client.tools
          : [],
        totalTasks: checklist.length,
        removedTasks,
        notNeededTasks,
        incompleteTasks,
        assignees,
      },
    });
  };

  const viewPortal = (id: string) => {
    if (!isPro) return;
    const portalUrl = `${window.location.origin}/shared/${id}`;
    window.open(portalUrl, "_blank");
    navigator.clipboard.writeText(portalUrl);
    alert("Client Portal link copied to clipboard!");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!isPro && clients.length >= 3) {
      alert("Starter plan is limited to 3 clients.");
      router.push("/pricing");
      return;
    }
    
    if (
      clientName.trim() === "" ||
      projectName.trim() === "" ||
      tools.length === 0 ||
      projectStartDate === "" ||
      projectEndDate === "" ||
      accessRemovalDeadline === "" ||
      accessReviewDate === ""
    ) {
      alert("Please complete all required fields and select at least one tool.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "clients"), {
        userId: user.uid,
        userEmail: user.email,
        name: clientName,
        projectName: projectName,
        tools: tools,
        projectStartDate: projectStartDate,
        projectEndDate: projectEndDate,
        accessRemovalDeadline: accessRemovalDeadline,
        accessReviewDate: accessReviewDate,
        date: accessReviewDate,
        notes: isPro ? notes : "",
        status: "pending",
        clientStatus: clientStatus,
        emailEnabled: isPro ? emailEnabled : false,
        createdAt: serverTimestamp()
      });
      
      // RESET FIELDS
      setClientName("");
      setClientStatus("active");
      setProjectName("");
      setTools([]);
      // STEP 5 — Reset it when saving
      setSelectedTemplate("");
      setProjectStartDate("");
      setProjectEndDate("");
      setAccessRemovalDeadline("");
      setAccessReviewDate("");
      setNotes("");
      setEmailEnabled(true);
      setToolSearch("");
      setActiveToolCategory("All");
      
      setIsModalOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save client.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "clients", id));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredClients = [...clients]
    .filter((client) => {
      const formattedTools = formatToolsDisplay(client.tools);

      const matchesSearch =
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedTools.toLowerCase().includes(searchTerm.toLowerCase());

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const deadlineDate = client.accessRemovalDeadline
        ? new Date(client.accessRemovalDeadline)
        : null;

      const checklist = Array.isArray(client.checklist)
        ? client.checklist
        : [];

      const completedTasks = checklist.filter(
        (task: any) =>
          task.status === "removed" ||
          task.status === "not_needed"
      ).length;

      const progress =
        checklist.length > 0
          ? Math.round((completedTasks / checklist.length) * 100)
          : 0;

      const isOverdue =
        client.clientStatus !== "closed" &&
        (client.clientStatus === "offboarding" ||
          client.clientStatus === "ready_to_close") &&
        deadlineDate !== null &&
        deadlineDate < today &&
        progress < 100;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "overdue"
          ? isOverdue
          : client.clientStatus === statusFilter);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return (
          new Date(b.createdAt?.toDate?.() || b.createdAt || 0).getTime() -
          new Date(a.createdAt?.toDate?.() || a.createdAt || 0).getTime()
        );
      }

      if (sortOption === "oldest") {
        return (
          new Date(a.createdAt?.toDate?.() || a.createdAt || 0).getTime() -
          new Date(b.createdAt?.toDate?.() || b.createdAt || 0).getTime()
        );
      }

      if (sortOption === "deadline_soonest") {
        return (
          new Date(a.accessRemovalDeadline || "9999-12-31").getTime() -
          new Date(b.accessRemovalDeadline || "9999-12-31").getTime()
        );
      }

      if (sortOption === "deadline_latest") {
        return (
          new Date(b.accessRemovalDeadline || "1900-01-01").getTime() -
          new Date(a.accessRemovalDeadline || "1900-01-01").getTime()
        );
      }

      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#243F74] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] animate-pulse">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]'} pb-10 relative text-sm`}>
      {showToast && (
        <div className="fixed top-24 right-4 md:right-10 z-[70] bg-[#9BCB3B] text-white px-5 py-2 rounded-xl font-black text-xs uppercase shadow-2xl animate-bounce">
          ✓ Client Saved
        </div>
      )}

      {/* NAVIGATION */}
      <nav className={`fixed w-full top-0 z-40 backdrop-blur-md border-b px-4 md:px-10 py-4 flex justify-between items-center transition-all ${isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <Link href="/">
              <Image src="/logo.png" alt="OffboardPro" width={110} height={35} className={`object-contain transition-all ${isDarkMode ? 'invert brightness-200' : ''}`} priority />
          </Link>
          <span className={`${isPro ? 'bg-[#9BCB3B] text-white' : 'bg-slate-200 text-slate-500'} text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest shadow-sm`}>
            {isPro ? "PRO" : "FREE"}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
            {isPro && (
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-slate-50 text-slate-400 border-slate-100'} border`}
              >
                {isDarkMode ? "☀️" : "🌙"}
              </button>
            )}

            <button onClick={() => { setIsSettingsOpen(true); setViewingSubscription(false); }} className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-[#243F74]'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-grow w-full max-w-7xl mx-auto pt-40 md:pt-48 pb-16 px-4 md:px-8">
        
        {/* PRO ONLY EMAIL WHITELIST BANNER */}
        {isPro && (
          <div className={`mb-8 p-5 rounded-[2rem] border-2 border-dashed flex flex-col md:flex-row items-center justify-between gap-6 transition-all animate-in fade-in slide-in-from-top-4 duration-700 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-blue-50/30 border-blue-100'}`}>
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className={`text-xs font-black uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-200' : 'text-[#243F74]'}`}>
                  Ensure Pro Delivery ⚡
                </p>
                <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                  Add <span className="text-[#9BCB3B] font-black">offboardpro@gmail.com</span> to your contacts to ensure automated alerts land in your primary inbox.
                </p>
              </div>
            </div>
            <button 
              onClick={() => alert("Marking our emails as 'Not Spam' ensures you never miss a critical access review!")}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-white text-slate-500 border-slate-100'} border`}
            >
              Whitelisting Guide
            </button>
          </div>
        )}

        {/* PRO AUTOMATION BADGE */}
        {isPro && (
          <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl w-fit animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
              Pro Automation: Daily 9:00 AM Scan Active
            </span>
          </div>
        )}

        {isPro && activeAlerts.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-3 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Smart Security Alerts
              </h4>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className={`min-w-[300px] border-2 p-5 rounded-[2rem] flex items-center justify-between transition-all ${isDarkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100 shadow-lg shadow-red-500/5'}`}>
                    <div>
                      <p className={`font-black text-sm italic mb-1 ${isDarkMode ? 'text-red-400' : 'text-[#243F74]'}`}>{alert.name}</p>
                      <p className={`text-[10px] font-black uppercase tracking-tight ${isDarkMode ? 'text-slate-400' : 'text-red-500'}`}>Access Review Overdue</p>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}

        {/* NEEDS YOUR ATTENTION */}
        {isPro && attentionItems.length > 0 && (
          <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                  Dashboard
                </p>
                <h2
                  className={`text-2xl md:text-3xl font-black italic ${
                    isDarkMode ? "text-white" : "text-[#243F74]"
                  }`}
                >
                  Needs Your Attention
                </h2>
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {attentionItems.length}{" "}
                {attentionItems.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {attentionItems.map((item: any) => (
                <div
                  key={item.id}
                  className={`rounded-[2rem] border-2 p-5 transition-all ${
                    isDarkMode
                      ? "bg-slate-900 border-slate-800 hover:border-slate-700"
                      : "bg-white border-slate-100 shadow-lg hover:shadow-xl"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3
                        className={`font-black italic text-lg truncate ${
                          isDarkMode ? "text-white" : "text-[#243F74]"
                        }`}
                      >
                        {item.name}
                      </h3>

                      {item.projectName && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 truncate">
                          {item.projectName}
                        </p>
                      )}
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                        item.attentionType === "overdue"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : item.attentionType === "ready"
                            ? "bg-[#9BCB3B]/10 text-[#6d941f] border-[#9BCB3B]/30"
                            : item.attentionType === "offboarding"
                              ? "bg-blue-50 text-blue-600 border-blue-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.attentionLabel}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-400 mt-4">
                    {item.attentionText}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    {item.accessRemovalDeadline ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Deadline: {item.accessRemovalDeadline}
                      </span>
                    ) : (
                      <span />
                    )}

                    {(item.clientStatus === "active" ||
                      item.clientStatus === "ending_soon") && (
                      <button
                        type="button"
                        onClick={() => startOffboarding(item.id)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition"
                      >
                        Start Offboarding
                      </button>
                    )}

                    {(item.clientStatus === "offboarding" ||
                      item.clientStatus === "ready_to_close") && (
                      <button
                        type="button"
                        onClick={() => closeClient(item.id)}
                        className="px-4 py-2 rounded-xl bg-[#9BCB3B] text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition"
                      >
                        Close Client
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 text-center lg:text-left">
          <div>
            <h1 className={`text-3xl md:text-5xl font-black tracking-tight italic mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>
              Welcome, <span style={{ color: '#9BCB3B' }}>{user?.displayName || "Freelancer"} 👋</span>
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">
              {clients.length === 0 ? "No client access tracked yet." : `${clients.length} / ${isPro ? '∞' : '3'} clients tracked`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full sm:w-64 border-2 rounded-2xl px-4 py-3 text-sm font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} />
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`border-2 rounded-2xl px-4 py-3 text-xs font-black outline-none ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-100 text-slate-600"
                }`}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="ending_soon">Ending Soon</option>
                <option value="offboarding">Offboarding</option>
                <option value="ready_to_close">Ready to Close</option>
                <option value="closed">Closed</option>
                <option value="overdue">Overdue</option>
              </select>

              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className={`border-2 rounded-2xl px-4 py-3 text-xs font-black outline-none ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-100 text-slate-600"
                }`}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="deadline_soonest">Deadline Soonest</option>
                <option value="deadline_latest">Deadline Latest</option>
              </select></div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isPro && (
                <Link 
                  href="/pricing"
                  className="flex-1 sm:flex-none bg-[#9BCB3B] text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#9BCB3B]/20 hover:scale-[1.05] active:scale-95 transition-all text-center flex items-center justify-center gap-2"
                >
                  🚀 Upgrade
                </Link>
              )}
              
              <button 
                onClick={() => setIsModalOpen(true)} 
                style={{ backgroundColor: '#243F74' }} 
                className="group flex-1 sm:flex-none text-white px-8 py-3.5 rounded-2xl font-black text-sm uppercase shadow-xl shadow-[#243F74]/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <span className="bg-[#9BCB3B] rounded-lg p-0.5 group-hover:rotate-90 transition-transform duration-300">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                </span>
                Add Client Project
              </button>
            </div>
          </div>
        </div>

        {/* PRO TOOLS ACTIONS */}
        {isPro && (
          <div className="flex flex-wrap items-center gap-4 mb-8 p-5 rounded-[2rem] border-2 bg-slate-500/5 border-slate-500/10 transition-all animate-in fade-in duration-700">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">Admin Tools:</span>
            <button onClick={generatePDF} className="bg-[#243F74] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#243F74]/20">📄 Export PDF</button>
            <button onClick={exportCSV} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-[#243F74]'}`}>📊 Export CSV</button>
            <button onClick={handleBulkDelete} className="bg-red-50 text-red-500 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest ml-auto hover:bg-red-500 hover:text-white transition-all border-2 border-red-100">🗑 Clear All</button>
          </div>
        )}

        {/* STATS CARDS */}
        {isPro && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10 animate-in slide-in-from-bottom-4 duration-700">
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Client Tools Tracked</span>
              <span className={`text-2xl md:text-3xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>{clients.length === 0 ? "0" : clients.length}</span>
            </div>
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center border-b-8 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`} style={{ borderBottomColor: securityMetrics.color }}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Access Status</span>
              <span style={{ color: securityMetrics.color }} className="text-sm md:text-lg font-black uppercase tracking-[0.15em] italic block mt-2">{securityMetrics.score}</span>
            </div>
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Access Alerts</span>
              <span className={`text-2xl md:text-3xl font-black italic ${activeAlerts.length > 0 ? 'text-red-500' : 'text-[#9BCB3B]'}`}>{activeAlerts.length === 0 ? "ALL CLEAR" : activeAlerts.length}</span>
            </div>
            <div className={`p-6 md:p-8 rounded-[2rem] border-2 text-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Next Access Review</span>
              <span className={`text-xs font-black uppercase truncate block px-2 ${isDarkMode ? 'text-slate-200' : 'text-[#243F74]'}`}>{clients.length > 0 ? clients[0].date : "NONE"}</span>
            </div>
          </div>
        )}

        {/* DYNAMIC EMPTY STATE VS TABLE */}
        {clients.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-24 px-6 rounded-[3rem] border-2 border-dashed transition-colors text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className={`text-2xl font-black italic mb-3 ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>No client access tracked.</h3>
            <p className="text-slate-400 max-w-sm font-bold leading-relaxed mb-8 uppercase text-[10px] tracking-widest">Add your first client to track tools and avoid forgotten access later.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-[#243F74] dark:text-[#9BCB3B] font-black uppercase text-xs tracking-widest border-b-2 border-[#9BCB3B] pb-1 hover:opacity-70 transition-all">Add First Client &rarr;</button>
          </div>
        ) : (
          <>
            <div className={`hidden md:block rounded-[2.5rem] border-2 shadow-2xl overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 shadow-none' : 'bg-white border-slate-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className={`${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'} border-b-2`}>
                    <tr>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black tracking-widest">Client & Tools</th>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black tracking-widest text-center">Lifecycle Status</th>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black tracking-widest text-center">Review Date</th>
                      <th className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => {
                      // 1. PROGRESS CALCULATION
                      const totalTasks = Array.isArray(client.checklist)
                        ? client.checklist.length
                        : 0;
                      const completedTasks = Array.isArray(client.checklist)
                        ? client.checklist.filter(
                            (task: any) =>
                              task.status === "removed" ||
                              task.status === "not_needed"
                          ).length
                        : 0;
                      const progress =
                        totalTasks > 0
                          ? Math.round((completedTasks / totalTasks) * 100)
                          : 0;

                      // 3. OVERDUE CALCULATION
                      const deadlineDate = client.accessRemovalDeadline
                        ? new Date(client.accessRemovalDeadline)
                        : null;
                      const isOverdue =
                        (client.clientStatus === "offboarding" || client.clientStatus === "ready_to_close") &&
                        deadlineDate !== null &&
                        deadlineDate < new Date() &&
                        progress < 100;

                      return (
                        <tr key={client.id} className={`border-b-2 transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-50 hover:bg-slate-50/50'}`}>
                          <td className="px-8 py-6">
                            <div className={`font-black italic text-lg leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{client.name}</div>
                            <div style={{ color: '#9BCB3B' }} className="text-[10px] font-black uppercase mt-1 tracking-widest">{formatToolsDisplay(client.tools)}</div>
                            
                            {/* DESKTOP CHECKLIST VIEW */}
                            {(client.clientStatus === "offboarding" || client.clientStatus === "ready_to_close") &&
                              Array.isArray(client.checklist) &&
                              client.checklist.length > 0 && (
                                <div className={`mt-5 rounded-2xl border p-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                                  
                                  {/* OVERDUE WARNING */}
                                  {isOverdue && (
                                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                                        <div>
                                          <p className="text-sm font-black text-red-700">
                                            Access removal deadline overdue
                                          </p>
                                          <p className="mt-1 text-xs font-semibold text-red-600">
                                            Complete the remaining offboarding tasks as soon as possible.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* PROGRESS UI */}
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                        Progress
                                      </span>
                                      <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                        {completedTasks}/{totalTasks} completed
                                      </span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-[#9BCB3B] transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <p className="mt-2 text-xs font-bold text-slate-400">
                                      {progress}% complete
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-between mb-4">
                                    <div>
                                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                        Offboarding Checklist
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    {client.checklist.map((task: any) => (
                                      <div
                                        key={task.id}
                                        className={`rounded-xl border p-3 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                              task.status === "removed"
                                                ? "bg-[#9BCB3B]"
                                                : task.status === "in_progress"
                                                  ? "bg-amber-400"
                                                  : task.status === "not_needed"
                                                    ? "bg-slate-400"
                                                    : task.status === "waiting_client"
                                                      ? "bg-blue-400"
                                                      : "bg-slate-300"
                                            }`}
                                          />

                                          <div className="flex-1 min-w-0">
                                            <p
                                              className={`text-sm font-bold ${
                                                task.status === "removed" ||
                                                task.status === "not_needed"
                                                  ? "text-slate-400 line-through"
                                                  : isDarkMode ? "text-slate-200" : "text-slate-700"
                                              }`}
                                            >
                                              {task.title}
                                            </p>

                                            <div className="flex items-center gap-2 mt-0.5">
                                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                                {task.tool}
                                              </p>

                                              {/* 4. VIEW INSTRUCTIONS BUTTON */}
                                              {TOOL_INSTRUCTIONS[task.tool] && (
                                                <button
                                                  type="button"
                                                  onClick={() => openToolInstructions(task)}
                                                  className={`text-[10px] font-black uppercase tracking-widest ${
                                                    isDarkMode
                                                      ? "text-blue-400 hover:text-blue-300"
                                                      : "text-[#243F74] hover:underline"
                                                  }`}
                                                >
                                                  View Instructions
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          <select
                                            value={task.status}
                                            onChange={(e) =>
                                              updateChecklistTask(
                                                client.id,
                                                task.id,
                                                e.target.value
                                              )
                                            }
                                            className={`rounded-lg border px-2 py-2 text-xs font-bold outline-none focus:border-[#9BCB3B] ${
                                              isDarkMode
                                                ? "bg-slate-800 border-slate-700 text-slate-200"
                                                : "bg-white border-slate-200 text-slate-600"
                                            }`}
                                          >
                                            <option value="pending">Pending</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="removed">Removed</option>
                                            <option value="not_needed">Not Needed</option>
                                            <option value="waiting_client">
                                              Waiting for Client
                                            </option>
                                          </select>

                                          {isPro && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                assignChecklistTask(client.id, task.id)
                                              }
                                              className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                                task.assignee
                                                  ? isDarkMode
                                                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                                    : "bg-blue-50 border-blue-200 text-blue-600"
                                                  : isDarkMode
                                                    ? "bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400"
                                                    : "bg-white border-slate-200 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                                              }`}
                                            >
                                              {task.assignee
                                                ? `👤 ${task.assignee}`
                                                : "Assign"}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                            )}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getClientStatusClasses(
                                client.clientStatus
                              )}`}
                            >
                              {getClientStatusLabel(client.clientStatus)}
                            </span>
                          </td>
                          <td className={`px-8 py-6 text-center font-black text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{client.date}</td>
                          <td className="px-8 py-6 text-right whitespace-nowrap space-x-2">
                            {/* 6A. ADDED ACTIVITY BUTTON */}
                            <button
                              type="button"
                              onClick={() => setActivityClient(client)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition ${
                                isDarkMode
                                  ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              Activity
                            </button>

                            {(client.clientStatus === "active" || client.clientStatus === "ending_soon") && (
                              <button
                                type="button"
                                onClick={() => startOffboarding(client.id)}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition"
                              >
                                Start Offboarding
                              </button>
                            )}
                            {(client.clientStatus === "offboarding" || client.clientStatus === "ready_to_close") && (
                              <button
                                type="button"
                                onClick={() => closeClient(client.id)}
                                className="px-4 py-2 rounded-xl bg-[#9BCB3B] text-white text-xs font-black hover:opacity-90 transition"
                              >
                                Close Client
                              </button>
                            )}

                            {/* STEP 4 — Desktop View Summary Button */}
                            {(client.clientStatus === "ready_to_close" ||
                              client.clientStatus === "closed") && (
                              <button
                                type="button"
                                onClick={() => openCompletionSummary(client)}
                                className="text-[#243F74] dark:text-[#9BCB3B] font-black text-[10px] uppercase tracking-widest hover:underline decoration-2 ml-2"
                              >
                                View Summary
                              </button>
                            )}

                            {isPro && <button onClick={() => viewPortal(client.id)} className="text-[#9BCB3B] font-black text-[10px] uppercase tracking-widest hover:underline decoration-2 ml-2">View Portal</button>}
                            <button onClick={() => handleDelete(client.id)} className="text-slate-500 hover:text-red-400 font-black text-[10px] uppercase transition-colors ml-2">Remove</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="md:hidden space-y-4">
              {filteredClients.map((client) => {
                // 1. PROGRESS CALCULATION
                const totalTasks = Array.isArray(client.checklist)
                  ? client.checklist.length
                  : 0;
                const completedTasks = Array.isArray(client.checklist)
                  ? client.checklist.filter(
                      (task: any) =>
                        task.status === "removed" ||
                        task.status === "not_needed"
                    ).length
                  : 0;
                const progress =
                  totalTasks > 0
                    ? Math.round((completedTasks / totalTasks) * 100)
                    : 0;

                // 3. OVERDUE CALCULATION
                const deadlineDate = client.accessRemovalDeadline
                  ? new Date(client.accessRemovalDeadline)
                  : null;
                const isOverdue =
                  (client.clientStatus === "offboarding" || client.clientStatus === "ready_to_close") &&
                  deadlineDate !== null &&
                  deadlineDate < new Date() &&
                  progress < 100;

                return (
                  <div key={client.id} className={`p-6 rounded-[2rem] border-2 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`font-black italic text-xl leading-tight ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{client.name}</h3>
                        <p style={{ color: '#9BCB3B' }} className="text-[10px] font-black uppercase tracking-widest mt-1">{formatToolsDisplay(client.tools)}</p>
                        
                        <div className="mt-3">
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</div>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${getClientStatusClasses(
                              client.clientStatus
                            )}`}
                          >
                            {getClientStatusLabel(client.clientStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MOBILE CHECKLIST VIEW */}
                    {(client.clientStatus === "offboarding" || client.clientStatus === "ready_to_close") &&
                      Array.isArray(client.checklist) &&
                      client.checklist.length > 0 && (
                        <div className={`mt-5 rounded-2xl border p-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                          
                          {/* OVERDUE WARNING */}
                          {isOverdue && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                                <div>
                                  <p className="text-sm font-black text-red-700">
                                    Access removal deadline overdue
                                  </p>
                                  <p className="mt-1 text-xs font-semibold text-red-600">
                                    Complete the remaining offboarding tasks as soon as possible.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* PROGRESS UI */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Progress
                              </span>
                              <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                                {completedTasks}/{totalTasks} completed
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#9BCB3B] transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs font-bold text-slate-400">
                              {progress}% complete
                            </p>
                          </div>

                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                                Offboarding Checklist
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {client.checklist.map((task: any) => (
                              <div
                                key={task.id}
                                className={`rounded-xl border p-3 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                      task.status === "removed"
                                        ? "bg-[#9BCB3B]"
                                        : task.status === "in_progress"
                                          ? "bg-amber-400"
                                          : task.status === "not_needed"
                                            ? "bg-slate-400"
                                            : task.status === "waiting_client"
                                              ? "bg-blue-400"
                                              : "bg-slate-300"
                                    }`}
                                  />

                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-bold ${
                                        task.status === "removed" ||
                                        task.status === "not_needed"
                                          ? "text-slate-400 line-through"
                                          : isDarkMode ? "text-slate-200" : "text-slate-700"
                                      }`}
                                    >
                                      {task.title}
                                    </p>

                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {task.tool}
                                      </p>

                                      {/* 4. VIEW INSTRUCTIONS BUTTON */}
                                      {TOOL_INSTRUCTIONS[task.tool] && (
                                        <button
                                          type="button"
                                          onClick={() => openToolInstructions(task)}
                                          className={`text-[10px] font-black uppercase tracking-widest ${
                                            isDarkMode
                                              ? "text-blue-400 hover:text-blue-300"
                                              : "text-[#243F74] hover:underline"
                                          }`}
                                        >
                                          View Instructions
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <select
                                    value={task.status}
                                    onChange={(e) =>
                                      updateChecklistTask(
                                        client.id,
                                        task.id,
                                        e.target.value
                                      )
                                    }
                                    className={`rounded-lg border px-2 py-2 text-xs font-bold outline-none focus:border-[#9BCB3B] ${
                                      isDarkMode
                                        ? "bg-slate-800 border-slate-700 text-slate-200"
                                        : "bg-white border-slate-200 text-slate-600"
                                    }`}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="removed">Removed</option>
                                    <option value="not_needed">Not Needed</option>
                                    <option value="waiting_client">
                                      Waiting for Client
                                    </option>
                                  </select>
                                </div>

                                {isPro && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      assignChecklistTask(client.id, task.id)
                                    }
                                    className={`w-full mt-2 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                      task.assignee
                                        ? isDarkMode
                                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                          : "bg-blue-50 border-blue-200 text-blue-600"
                                        : isDarkMode
                                          ? "bg-slate-800 border-slate-700 text-slate-400"
                                          : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                  >
                                    {task.assignee
                                      ? `👤 ${task.assignee}`
                                      : "Assign Task"}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4 border-t-2 border-slate-100 dark:border-slate-800 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-black text-sm">{client.date}</span>
                        <div className="flex gap-4 items-center">
                          {isPro && <button onClick={() => viewPortal(client.id)} className="text-[#9BCB3B] font-black text-xs uppercase tracking-widest">Portal</button>}
                          <button onClick={() => handleDelete(client.id)} className="text-red-400 font-black text-xs uppercase tracking-widest">Delete</button>
                        </div>
                      </div>
                      
                      {/* 6A. MOBILE ACTIVITY BUTTON */}
                      <button
                        type="button"
                        onClick={() => setActivityClient(client)}
                        className={`w-full py-2.5 rounded-xl border-2 text-xs font-black uppercase tracking-widest transition text-center ${
                          isDarkMode
                            ? "border-slate-700 text-slate-300 hover:bg-slate-800"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Activity
                      </button>

                      {/* STEP 5 — Mobile View Summary Button */}
                      {(client.clientStatus === "ready_to_close" ||
                        client.clientStatus === "closed") && (
                        <button
                          type="button"
                          onClick={() => openCompletionSummary(client)}
                          className={`w-full py-2.5 rounded-xl border-2 text-xs font-black transition text-center ${
                            isDarkMode
                              ? "border-slate-700 text-slate-300 hover:border-[#9BCB3B]"
                              : "border-slate-100 text-[#243F74] hover:border-[#9BCB3B]"
                          }`}
                        >
                          View Completion Summary
                        </button>
                      )}

                      {(client.clientStatus === "active" || client.clientStatus === "ending_soon") && (
                        <button
                          type="button"
                          onClick={() => startOffboarding(client.id)}
                          className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition text-center"
                        >
                          Start Offboarding
                        </button>
                      )}
                      {(client.clientStatus === "offboarding" || client.clientStatus === "ready_to_close") && (
                        <button
                          type="button"
                          onClick={() => closeClient(client.id)}
                          className="w-full py-2.5 rounded-xl bg-[#9BCB3B] text-white text-xs font-black hover:opacity-90 transition text-center"
                        >
                          Close Client
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* TOOL INSTRUCTIONS MODAL */}
      {instructionTask && currentInstruction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5 dark:border-slate-700 dark:bg-slate-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  How-To Guide
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  {instructionTask.tool}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setInstructionTask(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Close instructions"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-6">
              {/* Access Type */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                  Access Type
                </h3>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {currentInstruction.accessType}
                </div>
              </div>

              {/* Removal Steps */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                  Removal Steps
                </h3>

                <ol className="space-y-3">
                  {currentInstruction.steps.map((step, index) => (
                    <li
                      key={index}
                      className="flex gap-3 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {index + 1}
                      </span>

                      <span className="pt-0.5 leading-6">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Verification */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                  Verification
                </h3>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300">
                  {currentInstruction.verification}
                </div>
              </div>

              {/* Notes */}
              {currentInstruction.notes && currentInstruction.notes.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                    Notes
                  </h3>

                  <ul className="space-y-2">
                    {currentInstruction.notes.map((note, index) => (
                      <li
                        key={index}
                        className="flex gap-2 text-sm leading-6 text-slate-600 dark:text-slate-400"
                      >
                        <span>•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Official Help */}
              {currentInstruction.helpUrl && (
                <div>
                  <a
                    href={currentInstruction.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Open Official Help ↗
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setInstructionTask(null)}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6 — COMPLETION SUMMARY MODAL */}
      {completionSummaryClient && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[120] px-4">
          <div
            className={`w-full max-w-[620px] max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] ${
              isDarkMode
                ? "bg-slate-900 border-[#9BCB3B]"
                : "bg-white border-[#9BCB3B]"
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9BCB3B] mb-2">
                  Offboarding Complete
                </p>

                <h2
                  className={`text-3xl font-black italic ${
                    isDarkMode ? "text-white" : "text-[#243F74]"
                  }`}
                >
                  Completion Summary
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setCompletionSummaryClient(null)}
                className="text-slate-400 hover:text-red-500 transition-colors text-2xl font-black"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              {/* CLIENT */}
              <div
                className={`rounded-2xl border-2 p-5 ${
                  isDarkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-slate-50 border-slate-100"
                }`}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Client
                </p>

                <h3
                  className={`text-xl font-black ${
                    isDarkMode ? "text-white" : "text-[#243F74]"
                  }`}
                >
                  {completionSummaryClient.completionSnapshot?.clientName ||
                    completionSummaryClient.name}
                </h3>

                {(
                  completionSummaryClient.completionSnapshot?.projectName ||
                  completionSummaryClient.projectName
                ) && (
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    {completionSummaryClient.completionSnapshot?.projectName ||
                      completionSummaryClient.projectName}
                  </p>
                )}
              </div>

              {/* FINAL STATUS */}
              <div className="flex items-center justify-between rounded-2xl border-2 border-[#9BCB3B]/20 bg-[#9BCB3B]/5 px-5 py-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Final Status
                </span>

                <span className="rounded-full bg-[#9BCB3B] text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest">
                  {completionSummaryClient.clientStatus === "closed"
                    ? "Closed"
                    : "Ready to Close"}
                </span>
              </div>

              {/* TOOLS */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Tools / Access
                </p>

                <div className="flex flex-wrap gap-2">
                  {(completionSummaryClient.completionSnapshot?.tools || []).map(
                    (tool: string) => (
                      <span
                        key={tool}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border ${
                          isDarkMode
                            ? "bg-slate-800 border-slate-700 text-slate-300"
                            : "bg-slate-50 border-slate-100 text-slate-600"
                        }`}
                      >
                        {tool}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* TASK SUMMARY */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Task Summary
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="rounded-2xl border-2 border-slate-100 p-4 text-center">
                    <p className="text-xl font-black text-[#243F74]">
                      {completionSummaryClient.completionSnapshot?.totalTasks || 0}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                      Total
                    </p>
                  </div>

                  <div className="rounded-2xl border-2 border-[#9BCB3B]/20 bg-[#9BCB3B]/5 p-4 text-center">
                    <p className="text-xl font-black text-[#6d941f]">
                      {completionSummaryClient.completionSnapshot?.removedTasks || 0}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                      Removed
                    </p>
                  </div>

                  <div className="rounded-2xl border-2 border-slate-100 p-4 text-center">
                    <p className="text-xl font-black text-slate-500">
                      {completionSummaryClient.completionSnapshot?.notNeededTasks || 0}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                      Not Needed
                    </p>
                  </div>

                  <div className="rounded-2xl border-2 border-red-100 bg-red-50 p-4 text-center">
                    <p className="text-xl font-black text-red-500">
                      {completionSummaryClient.completionSnapshot?.incompleteTasks || 0}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-1">
                      Incomplete
                    </p>
                  </div>
                </div>
              </div>

              {/* PRO ASSIGNEES */}
              {isPro && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Assigned Team Members
                  </p>

                  {completionSummaryClient.completionSnapshot?.assignees?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {completionSummaryClient.completionSnapshot.assignees.map(
                        (assignee: string) => (
                          <span
                            key={assignee}
                            className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold"
                          >
                            👤 {assignee}
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400">
                      No team members were assigned.
                    </p>
                  )}
                </div>
              )}

              {/* CLOSE REASON */}
              {completionSummaryClient.closeReason && (
                <div
                  className={`rounded-2xl border-2 p-5 ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Closure Note
                  </p>

                  <p
                    className={`text-sm font-bold leading-relaxed ${
                      isDarkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {completionSummaryClient.closeReason}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setCompletionSummaryClient(null)}
                className="w-full py-4 rounded-2xl bg-[#243F74] text-white font-black text-xs uppercase tracking-widest hover:opacity-90 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6C. ADD THE ACTIVITY MODAL */}
      {activityClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setActivityClient(null)}
          />

          <div
            className={`relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-3xl border shadow-2xl ${
              isDarkMode
                ? "bg-slate-950 border-slate-800"
                : "bg-white border-slate-100"
            }`}
          >
            {/* HEADER */}
            <div
              className={`px-6 py-5 border-b ${
                isDarkMode ? "border-slate-800" : "border-slate-100"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#9BCB3B]">
                    Activity
                  </p>

                  <h2
                    className={`text-xl font-black mt-1 ${
                      isDarkMode ? "text-white" : "text-[#243F74]"
                    }`}
                  >
                    {activityClient.name || "Client"}
                  </h2>

                  {activityClient.projectName && (
                    <p className="text-xs font-bold text-slate-400 mt-1">
                      {activityClient.projectName}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActivityClient(null)}
                  className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg font-bold ${
                    isDarkMode
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  ×
                </button>
              </div>
            </div>

            {/* TIMELINE */}
            <div className="overflow-y-auto max-h-[65vh] p-6">
              {Array.isArray(activityClient.activityLog) &&
              activityClient.activityLog.length > 0 ? (
                <div className="relative">
                  <div
                    className={`absolute left-[7px] top-2 bottom-2 w-px ${
                      isDarkMode ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  />

                  <div className="space-y-6">
                    {activityClient.activityLog.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="relative flex gap-4"
                      >
                        <div
                          className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-4 ${
                            isDarkMode
                              ? "bg-slate-950 border-[#9BCB3B]"
                              : "bg-white border-[#9BCB3B]"
                          }`}
                        />

                        <div className="min-w-0 flex-1">
                          <div
                            className={`rounded-2xl border p-4 ${
                              isDarkMode
                                ? "bg-slate-900 border-slate-800"
                                : "bg-slate-50 border-slate-100"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <p
                                  className={`text-sm font-black ${
                                    isDarkMode
                                      ? "text-slate-200"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {activity.message}
                                </p>

                                {activity.taskTitle && (
                                  <p className="text-xs font-bold text-slate-400 mt-1">
                                    {activity.taskTitle}
                                    {activity.tool
                                      ? ` • ${activity.tool}`
                                      : ""}
                                  </p>
                                )}
                              </div>

                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {activity.timestamp
                                  ? new Date(
                                      activity.timestamp
                                    ).toLocaleString()
                                  : "—"}
                              </span>
                            </div>

                            {activity.actor && (
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-3">
                                By {activity.actor}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center">
                  <p className="text-sm font-black text-slate-400">
                    No activity yet
                  </p>

                  <p className="text-xs font-bold text-slate-400 mt-2">
                    Client activity will appear here as you work.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[100] px-4">
            <div className={`w-full max-w-[380px] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] transition-all animate-in zoom-in duration-300 ${isDarkMode ? 'bg-slate-900 border-[#9BCB3B]' : 'bg-white border-[#243F74]'}`}>
              
              {!viewingSubscription ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>Settings</h2>
                      <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors text-2xl font-black">✕</button>
                  </div>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-2xl text-left border-2 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest block mb-1 opacity-60 text-slate-400">Account</span>
                      <p className={`text-sm font-black truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>{user?.email}</p>
                    </div>

                    <button 
                      onClick={() => setViewingSubscription(true)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all group ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-[#9BCB3B]' : 'bg-white border-slate-100 shadow-sm hover:border-[#243F74]'}`}
                    >
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Subscription</span>
                        <h3 className={`text-lg font-black italic ${isDarkMode ? 'text-[#9BCB3B]' : 'text-[#243F74]'}`}>{isPro ? "Professional" : "Free Starter"}</h3>
                      </div>
                      <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
                    </button>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button onClick={handleLogout} className="py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest transition-colors hover:bg-slate-200">Log Out</button>
                      <button onClick={handleDeleteAccount} className="py-4 rounded-2xl bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 border-2 border-red-100 hover:text-white transition-all shadow-lg shadow-red-500/10">Delete</button>
                    </div>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="mt-8 text-slate-400 text-xs font-black uppercase block w-full transition-colors tracking-widest text-center">Close</button>
                </>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <button onClick={() => setViewingSubscription(false)} className="text-slate-400 text-lg">←</button>
                    <h2 className={`text-2xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>Billing</h2>
                  </div>

                  <div className={`p-5 rounded-3xl border-2 mb-6 ${isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Current Plan</span>
                      <div className="flex items-center justify-between">
                        <h4 className={`text-xl font-black italic ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>{subscriptionData?.plan}</h4>
                        <span className="bg-[#9BCB3B]/10 text-[#9BCB3B] text-[9px] px-2 py-1 rounded-md font-black">ACTIVE</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Provider</span>
                        <p className={`text-xs font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Razorpay</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!isPro ? (
                      <button 
                        onClick={() => router.push("/pricing")}
                        className="w-full py-4 bg-[#9BCB3B] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#9BCB3B]/20 transition-all hover:scale-[1.02]"
                      >
                        Upgrade to Pro
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if(confirm("Are you sure you want to cancel? You will lose Pro access at the end of your billing cycle.")) {
                             alert("Cancellation request received. Our team will process this within 24 hours.");
                          }
                        }}
                        className="w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-red-400 hover:bg-red-50 transition-all border-2 border-transparent hover:border-red-100"
                      >
                        Cancel Subscription
                      </button>
                    )}
                  </div>

                  <p className="text-[8px] text-slate-400 font-bold uppercase text-center mt-6 leading-relaxed">
                    Managed via Razorpay Secure. <br/> Support: support@offboardpro.com
                  </p>
                </div>
              )}
            </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl flex items-center justify-center z-[100] px-4">
            <div className={`w-full max-w-[540px] rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] transition-all animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-900 border-[#9BCB3B]' : 'bg-white border-[#9BCB3B]'}`}>
              
              <h2 className={`text-3xl font-black italic mb-6 ${isDarkMode ? 'text-white' : 'text-[#243F74]'}`}>Add Client Project</h2>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Client / Company name" 
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-slate-50 border-slate-100 focus:border-[#9BCB3B]'}`} 
                />

                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project / Engagement name"
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]"
                      : "bg-slate-50 border-slate-100 focus:border-[#9BCB3B]"
                  }`}
                />

                {/* STEP 4 — Add the UI (OFFBOARDING TEMPLATE) */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Start with a template
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {Object.keys(OFFBOARDING_TEMPLATES).map((template) => {
                      const selected = selectedTemplate === template;

                      return (
                        <button
                          key={template}
                          type="button"
                          onClick={() => applyOffboardingTemplate(template)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition ${
                            selected
                              ? "border-[#9BCB3B] bg-[#9BCB3B]/10 text-[#6d941f]"
                              : isDarkMode
                                ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                                : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                          }`}
                        >
                          {template}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-2 text-[10px] font-semibold text-slate-400">
                    Select a template to pre-select common tools. You can add or remove tools below.
                  </p>
                </div>

                {/* TOOL LIBRARY */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Tools used for this client
                  </label>

                  {/* Search */}
                  <input
                    type="text"
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    placeholder="Search tools..."
                    className={`w-full border-2 rounded-2xl px-5 py-3.5 font-bold outline-none text-sm mb-3 ${
                      isDarkMode
                        ? "bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-[#9BCB3B]"
                        : "bg-slate-50 border-slate-100 text-slate-800 placeholder:text-slate-400 focus:border-[#9BCB3B]"
                    }`}
                  />

                  {/* Categories */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {["All", ...Object.keys(TOOL_LIBRARY)].map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveToolCategory(category)}
                        className={`shrink-0 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide border-2 transition ${
                          activeToolCategory === category
                            ? "border-[#9BCB3B] bg-[#9BCB3B]/10 text-[#6d941f]"
                            : isDarkMode
                              ? "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500"
                              : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  {/* Tools */}
                  <div className="mt-2 max-h-64 overflow-y-auto p-1 space-y-4">
                    {Object.entries(TOOL_LIBRARY)
                      .filter(([category]) =>
                        activeToolCategory === "All"
                          ? true
                          : category === activeToolCategory
                      )
                      .map(([category, categoryTools]) => {
                        const filteredTools = categoryTools
                          .filter((tool) =>
                            tool.toLowerCase().includes(toolSearch.toLowerCase())
                          )
                          .sort((a, b) => a.localeCompare(b));

                        if (filteredTools.length === 0) return null;

                        return (
                          <div key={category}>
                            {/* Category heading */}
                            {activeToolCategory === "All" && (
                              <p
                                className={`text-[9px] font-black uppercase tracking-widest mb-2 px-1 ${
                                  isDarkMode ? "text-slate-500" : "text-slate-400"
                                }`}
                              >
                                {category}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {filteredTools.map((tool) => {
                                const selected = tools.includes(tool);

                                return (
                                  <button
                                    key={tool}
                                    type="button"
                                    onClick={() => toggleTool(tool)}
                                    className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition ${
                                      selected
                                        ? "border-[#9BCB3B] bg-[#9BCB3B]/10 text-[#6d941f]"
                                        : isDarkMode
                                          ? "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500"
                                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200"
                                    }`}
                                  >
                                    {tool}
                                    {selected && " ×"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Selected count */}
                  {tools.length > 0 && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-slate-400">
                        {tools.length} tool{tools.length === 1 ? "" : "s"} selected
                      </p>

                      <button
                        type="button"
                        onClick={() => setTools([])}
                        className="text-[10px] font-black uppercase tracking-wider text-red-400 hover:text-red-500"
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* 4 DATE FIELDS IN A 2x2 GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Project Start Date
                    </label>
                    <input
                      type="date"
                      value={projectStartDate}
                      onChange={(e) => setProjectStartDate(e.target.value)}
                      className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]"
                          : "bg-white border-slate-100 focus:border-[#9BCB3B]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Project End Date
                    </label>
                    <input
                      type="date"
                      value={projectEndDate}
                      onChange={(e) => setProjectEndDate(e.target.value)}
                      className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]"
                          : "bg-white border-slate-100 focus:border-[#9BCB3B]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Access Removal Deadline
                    </label>
                    <input
                      type="date"
                      value={accessRemovalDeadline}
                      onChange={(e) => setAccessRemovalDeadline(e.target.value)}
                      className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]"
                          : "bg-white border-slate-100 focus:border-[#9BCB3B]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Access Review Date
                    </label>
                    <input
                      type="date"
                      value={accessReviewDate}
                      onChange={(e) => setAccessReviewDate(e.target.value)}
                      className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none text-sm ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]"
                          : "bg-white border-slate-100 focus:border-[#9BCB3B]"
                      }`}
                    />
                  </div>
                </div>
                
                <textarea 
                  disabled={!isPro} 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder={isPro ? "Notes (optional)" : "Pro required for notes"} 
                  rows={3} 
                  className={`w-full border-2 rounded-2xl px-5 py-3.5 font-black outline-none resize-none text-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#9BCB3B]' : 'bg-white border-slate-100 focus:border-[#9BCB3B]'}`} 
                />

                {/* EMAIL REMINDER PRO SECTION */}
                {isPro ? (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">Email Alerts</p>
                        <p className="text-[9px] font-bold text-blue-500 uppercase">
                          {emailEnabled ? "Active at 9:00 AM" : "Reminders Muted"}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEmailEnabled(!emailEnabled)}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${emailEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${emailEnabled ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-100 border-dashed rounded-2xl flex items-center justify-between opacity-60">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2v6a2 2 0 02 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Alerts (Pro)</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Upgrade to enable reminders</p>
                      </div>
                    </div>
                    <button onClick={() => router.push("/pricing")} className="text-[8px] font-black bg-slate-200 text-[#243F74] px-2.5 py-1 rounded-md uppercase tracking-widest hover:bg-[#9BCB3B] hover:text-white transition-all">Unlock</button>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsModalOpen(false)} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>Cancel</button>
                  <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-[#243F74] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-[#243F74]/30 active:scale-95 transition-all">{isSaving ? "Saving..." : "SAVE CLIENT"}</button>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}