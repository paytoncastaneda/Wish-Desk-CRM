# **Sugarwish CRM: Product Requirement Document**

This document outlines the specifications for building the internal Sugarwish CRM application, transitioning from Insightly CRM.

## **1\. Project Overview**

### **Purpose**

To transition our Insightly CRM entirely onto the Sugarwish platform, making it visible exclusively to Sugarwish super admins. This move aims to streamline processes by creating instant visibility of updated user and company data for the Gift Concierge team directly within Sugarwish, eliminating delays from nightly/weekly data pushes. It will also cut software costs (eliminating Insightly), limit API calls across platforms, improve sales revenue accuracy, and provide quicker access to site information and order entry functionalities.

### **Goals**

* Reduce time spent by the Gift Concierge team clicking through different sites by providing instant user/company information within the Sugarwish site.  
* Enable direct messaging with users from within Sugarwish, ensuring all communication touchpoints are tracked, not just the most recent.  
* Fully transition to the Sugarwish CRM by August 1, 2025, decommissioning Insightly CRM before its renewal date.  
* Allow adequate time for the Gift Concierge team to learn and utilize the new CRM effectively before the busy holiday season (HHS).

  ### **Target Users**

* **Gift Concierge (GC) \- Super Admin:** Will have custom visibility into CRM data. Certain fields may be view-only, not editable.  
  * Defined fields, TBD  
* **Administrator**: Full CRM management capabilities.  
  * Define specific needs

  ### **Key Milestones**

* **Phase 1: Identification & Documentation (Current)**  
  * Identify all necessary CRM fields and functional requirements needed for implementation in Replit and integration within Sugarwish Java, as defined in this document.  
* **Phase 2: Creation & Refinement (Target: June 1, 2025\)**  
  * Build the CRM application using Replit (potentially AI-assisted).  
  * Utilize tools/processes (e.g., other AIs) to identify and resolve bugs/issues before the soft launch.  
* **Phase 3: Soft Launch (Target: July 7, 2025\)**  
  * Introduce the new CRM to the Gift Concierge team.  
  * Conduct training and gather feedback on issues or desired updates before the High Holiday Season (HHS).  
* **Phase 4: Full Functionality (Target: August 1, 2025\)**  
  * Implement any critical updates or additional urgent needs identified during the soft launch to ensure seamless operation during the holiday season.

  ## **2\. Definitions**

  ### **Tasks**

  Tasks represent actionable items, reminders, or logged activities within the CRM that need to be completed by a user.

* **Purpose:** Used for managing workload, tracking interactions (like calls or meetings), creating To-Do lists, and setting reminders related to specific Contacts, Organizations, Leads, or Opportunities.  
* **Common Attributes:** Typically include a subject, type (e.g., Call, Email, To-Do, Meeting), due date, status (e.g., Not Started, In Progress, Completed), priority, assigned user, and links to related records.  
* **Fields** reflected on the **swcrm\_tasks** table in [db New Sales Tables](https://docs.google.com/spreadsheets/d/1rTWV3glKcthEo-p9s8RiCYpQUTUElqHhqgBaKwEyk2I/edit?gid=1610762140#gid=1610762140) sheet

  ### **Opportunities**

  Opportunities represent potential sales deals, purchased credit, or other revenue-generating activities that are being tracked through a sales or engagement process.

* **Purpose:** Central records for managing potential deals, tracking their progress, estimating potential revenue, and forecasting sales.  
* **Linkage:** Typically linked to originating Leads (if applicable) and associated Contacts and Organizations involved in the deal. As well as Proposals found in the database  
* **Common Attributes:** Include Opportunity Name, Value/Amount, Estimated Close Date, Probability of Winning (%), Current Stage in the pipeline, and Assigned Owner. Linked Contact and Organization  
* **Pipeline Stages:** Opportunities move through a defined sequence of stages representing the sales process.  
  * Expressed Interest \> Proposal Sent \> Active Discussions \> Order Paid \> Closed  
    * Closed being reflected as:  
      * WON: Order Placed  
      * LOST: No Longer Interested  
      * INVALID \- BOGUS  
      * ABANDONED: No Response  
      * SUSPENDED: Cold  
* **Fields and definitions** reflected on the **swcrm\_opportunities** table in [db New Sales Tables](https://docs.google.com/spreadsheets/d/1rTWV3glKcthEo-p9s8RiCYpQUTUElqHhqgBaKwEyk2I/edit?gid=1610762140#gid=1610762140) sheet

  ### **Leads**

  Leads are individuals who have not yet created a Sugarwish Corporate account and either have a Consumer account or no account at all.

* **Purpose:** To capture and track potential interest from various sources before dedicating significant sales resources. The focus is doing a journey to get them to create a corporate account  
* **Origin:** Placing an order with a none generic email address and not already having a corporate account  
* **Lifecycle:** Leads are typically captured, enriched, and then ideally converted into Contact, Organization, and/or Opportunity records.  
* **Common Attributes:** Name, Company, Email, Phone, Lead Source, Status (e.g., New, Contacted, Qualified, No Response, Cold, Not Interested), Inquiry Details.  
  *Payton pick up from here \- still reviewing / updating document*

  ### **Contacts/Users**

  Contacts are individuals whose details are stored in the CRM, typically people you build relationships with, such as customers, prospects at organizations, or business partners.

* **Purpose:** To maintain a central record of individuals, their contact information, communication history, and relationships with other CRM records (Organizations, Opportunities, Tasks). Often considered the core "people" record for external relationships.  
* **Association:** Contacts are usually linked to an Organization (their employer) and can be linked to multiple Opportunities, Tasks, Projects, or Cases depending on the CRM setup.  
* **Common Attributes:** Name (First, Last), Title, Email Address(es), Phone Number(s), Mailing Address, Associated Organization, Communication History, Notes.Needs Definition:What specific information is required for a Sugarwish Contact? How are Contacts definitively associated with Organizations, Leads (during conversion), Opportunities, and Tasks?  
  * *Clarification Needed:*Does "Users" in this context specifically refer tointernalSugarwish CRM users (GCs, Admins) or is it synonymous with externalContacts? Standard CRM practice usually separates internal system users from external contacts.


  ### **Organizations/Companies**

  Organizations (or Companies/Accounts) are the businesses or entities that Sugarwish engages with.

* **Purpose:** To store company-level information and act as a central record for grouping multiple Contacts who work at that company. Allows tracking of overall relationship and activity at the company level.  
* **Common Attributes:** Organization Name, Website, Phone Number, Billing/Shipping Addresses, Industry, Number of Employees, Parent Organization (if applicable), Associated Contacts, Related Opportunities, Activity History.  
  * Needs Definition:What specific information is required for a Sugarwish Organization? What types of organizations (e.g., Clients, Prospects, Partners, Vendors) will be tracked?


  ### **Database ('db')**

* Needs Definition:Specify the type of database being used (e.g., MySQL, PostgreSQL). Where is it hosted (e.g., AWS RDS)?  
* Needs Definition:What is its primary role concerning the CRM? (i.e., the central repository for all CRM data, integrated with the main Sugarwish application database or separate?)  
* Specific tables to pull information from: [db New Sales Tables](https://docs.google.com/spreadsheets/d/1rTWV3glKcthEo-p9s8RiCYpQUTUElqHhqgBaKwEyk2I/edit?gid=443628366#gid=443628366)


  ### **Backend site**

* Needs Definition:Clarify what "backend of our site" or "Sugarwish site" refers to in the context of where the CRM will live. Is it an internal admin panel within the main Sugarwish Java application, or a separate application?


  ### **Gift Concierge/Super Admins (GCs)**

* Needs Definition:Define the precise scope of their access (which data/modules can they view/edit?). Define their key responsibilities within the CRM system.  
    
  \---


  ## **3\. Components**

  ### **Backend Interface**

* Needs Definition:What are the key sections/modules required? (e.g., Dashboard, Contacts List/View, Organizations List/View, Leads List/View, Opportunities Kanban/List/View, Tasks List/View, Search, Reporting)  
* Needs Definition:How will users navigate between these sections? (e.g., Sidebar menu, Top navigation bar)  
* Needs Definition:What specific UI elements are needed? (e.g., Data tables with sorting/filtering, Forms for data entry/editing, Calendar views for tasks, Kanban boards for opportunities, Search bars)


  ### **Database Integration**

* Needs Definition:How will the Replit app connect to the existing database ('db')? (e.g., Direct DB connection string, through an existing API layer?) Specify security measures for this connection.  
* Needs Definition:List the specific database tables that will store/be referenced for Tasks, Opportunities, Leads, Contacts, and Organizations. Include relationships (foreign keys). (See also Section 5 \- Database Schema).  
* Needs Definition:How will data be read (queries) and written (inserts/updates)? Will an ORM (Object-Relational Mapper) be used? Specify any performance considerations for data access.


  ### **User Authentication/Authorization**

* Needs Definition:How will users log in? (e.g., Via existing Sugarwish admin login/SSO, Separate CRM login)  
* Needs Definition:Define the distinct permission levels for Gift Concierges (Super Admins) and Administrators. What actions/data access does each level permit/deny? (Role-Based Access Control \- RBAC).  
* Needs Definition:How will data access be secured based on roles? How will authentication tokens or sessions be managed?


  ## **4\. Functionality**

  ### **Data Management**

* **Import from Insightly:**  
  * Needs Definition:Detail the step-by-step process for migrating data from Insightly. Will this be a one-time bulk import?  
  * Needs Definition:Specify exactly which data fields for Tasks, Opportunities, Leads, Contacts, and Organizations need to be migrated.  
  * Needs Definition:How will data mapping between Insightly fields and new Sugarwish CRM fields be handled? Address potential data cleaning/transformation needs.  
* **Record Creation/Editing:**  
  * Needs Definition:Describe the forms and user workflows for creating and editing Tasks, Opportunities, Leads, Contacts, and Organizations.  
  * Needs Definition:What data validation rules are required for key fields? (e.g., Email format, required fields, date formats).  
* **Data Deletion/Archiving:**  
  * Needs Definition:How will records be handled when no longer active? (e.g., Soft delete/archiving, Hard delete). Define the policy and procedure.


  ### **Contact Visibility & Querying**

* Needs Definition:Identify the specific fields across relevant tables (Contacts, Organizations, etc.) crucial for providing a comprehensive view of a contact/user. (Also see Section 5 \- DB Schema).  
* Needs Definition:How will users search and filter Contacts, Organizations, Leads, Opportunities, and Tasks? (e.g., By name, email, company, status, assigned user, date ranges).  
* Needs Definition:What information should be displayed on the main contact view page? (e.g., Contact details, Associated Organization, Recent activity/notes, Related Tasks, Related Opportunities, Communication history).  
* Additional specific queries/views needed for: Contact/Users Page, Companies/Organization Page, Opportunity Page, Proposal Page.


  ### **Task Management**

* Needs Definition:How will tasks be created? How will they be assigned to specific users (GCs/Admins)?  
* Needs Definition:What information must be included in a task record? (e.g., Subject/Title, Due Date, Priority, Status, Related Contact/Opportunity/Organization, Assigned User, Description).  
* Needs Definition:How will users view their assigned tasks? (e.g., Dashboard widget, Dedicated Task list). How will they update task status (e.g., Open, In Progress, Completed)?


  ### **Opportunity Tracking**

* Needs Definition:How will opportunities be linked to Contacts and Organizations? (Allow multiple contacts per opportunity?).  
* Needs Definition:Define the specific stages in the opportunity pipeline (based on the definition in Section 2).  
* Needs Definition:How will users update the stage, estimated value, close date, and probability of opportunities? Will there be required fields at certain stages?


  ### **Lead Management**

* Needs Definition:How will new leads be entered? (e.g., Manual entry form, Import from file, Potential future API integration).  
* Needs Definition:Describe the process/workflow for qualifying leads. What criteria determine qualification? How are leads converted into Contacts, Organizations, and/or Opportunities?


  ### **Organization and Contact Management**

* Needs Definition:How will contacts be associated with organizations? (e.g., Lookup field on the contact record).  
* Needs Definition:How will the system handle multiple contacts belonging to the same organization? How will the primary contact be designated, if needed?  
* Needs Definition:What is the process for adding new organizations and managing existing ones?


  ### **Journeys**

* Implement functionality for automated email journeys based on predefined email templates.  
* Contacts can be added to journeys based on meeting specific criteria related to:  
  * New Accounts  
  * New Leads  
  * Open Opportunities  
  * Marketing email campaigns  
* Needs Definition:Specify the triggering criteria for each journey type. How are templates managed? How is journey progress tracked?


  ### **Email Integration**

* Users should be able to message users directly from Sugarwish and track all touchpoints.  
* Potential Roadblock: Requires POP email connection to show Gmail/email integration for inbound and outbound history.  
  * Needs Definition:Specify the exact requirements for email integration. View emails? Send emails? Sync emails automatically? Log emails manually? Which providers need support (Gmail confirmed, others?)? How will threading/conversations be handled?


  ### **Other Functionality**

* Bulk Email send capability.  
  * Needs Definition:Specify requirements (e.g., select list of contacts, use templates, scheduling, tracking opens/clicks).  
* Template management (presumably for emails/journeys).


  ## **5\. Technical Considerations**

  ### **Replit Apps Environment**

* Needs Definition:What specific Replit features/services will be used? (e.g., Replit AI Agent for building, Hosting, Database integration features, Secrets management).  
* Needs Definition:Consider and document the implications of using Replit for hosting and deployment (e.g., Scalability, Reliability/SLAs, Cost structure, Maintenance, Security constraints/features).


  ### **Database Schema**

* Needs Definition:Provide a detailed logical and physical schema for each CRM table (Tasks, Opportunities, Leads, Contacts, Organizations, Notes, Communication Logs, etc.).  
* Needs Definition:Specify data types, field lengths, constraints (NOT NULL, UNIQUE), primary keys, and foreign key relationships between tables.  
* Needs Definition:Explicitly highlight the fields across tables that will be indexed and used for the Contact Visibility & Querying functionality defined in Section 4\.  
* Source tables include  [db New Sales Tables](https://docs.google.com/spreadsheets/d/1rTWV3glKcthEo-p9s8RiCYpQUTUElqHhqgBaKwEyk2I/edit?gid=443628366#gid=443628366)


  ### **Technologies Used**

  Integration Target: Sugarwish Java application. 

  Development Environment: Replit. 

  Needs Definition:Specify the programming language(s) (e.g., Python, Node.js, Java?) and framework(s) (e.g., Flask, Express, React, Angular?) for the backend and frontend (if separate).

  Needs Definition:List key libraries or dependencies anticipated (e.g., Database connectors, ORM, Authentication libraries, API framework).

  (From Original Strategy Example \- Needs Confirmation/Update):

  Frontend Framework:React?

  Backend Framework:NestJS?

  Languages:TypeScript?

  Database:MySQL hosted on AWS RDS?

  Authentication:JWT with existing Sugarwish SSO?

  Deployment:Replit AI, AWS EC2?


  ### **API Design (if applicable)**

* Needs Definition:If the CRM frontend is separate from the backend logic, outline the necessary API endpoints (e.g., using REST or GraphQL). Define request/response formats (e.g., JSON). Specify API documentation standard (e.g., OpenAPI/Swagger).


  ### **Data Security**

* Needs Definition: How will sensitive CRM data be protected at rest (database encryption?) and in transit (SSL/TLS)?  
* Needs Definition: What specific measures will prevent unauthorized access? (e.g., Role-Based Access Control enforcement at API/data level, Input validation to prevent injection attacks, Regular security audits).


  ## **6\. Design Guidelines**

  ### **Branding Colors**

  Consistent use of brand colors throughout the CRM interface is required.


  Primary:

  | Name             | Hex           |

  | :--------------- | :------------ |

  | Darkest Wish     | \`\#721319\`     |

  | Dark Wish        | \`\#a61c25\`     |

  | Wish             | \`\#d2232a\`     |

  | Medium Wish      | \`\#e87373\`     |

  | Light Wish       | \`\#f6cbcb\`     |

  | Lightest Wish    | \`\#fef6f6\`     |

  | Transparent Wish | \`\#fdf4f4, 50%\` |


  Secondary:

  | Name              | Hex          |

  | :---------------- | :----------- |

  | Darkest Sugar     | \`\#1b575e\`    |

  | Dark Sugar        | \`\#277e88\`    |

  | Sugar             | \`\#55c5ce\`    |

  | Medium Sugar      | \`\#a4e0e5\`    |

  | Light Sugar       | \`\#ccedf0\`    |

  | Lightest Sugar    | \`\#f3fbfc\`    |

  | Transparent Sugar | \`\#55c5ce, 8%\` |


  Neutrals:

  | Name              | Hex           |

  | :---------------- | :------------ |

  | Darkest Gray      | \`\#737373\`     |

  | Dark Gray         | \`\#969696\`     |

  | Gray              | \`\#cccccc\`     |

  | Medium Gray       | \`\#ebebeb\`     |

  | Light Gray        | \`\#f5f5f5\`     |

  | Lightest Gray     | \`\#f9f9fb\`     |

  | Transparent Gray  | \`\#f6f6f9\`     |

  | Dark              | \`\#2d3333\`     |

  | White             | \`\#ffffff\`     |

  | Transparent Dark  | \`\#2d3333, 75%\` |

  | Transparent White | \`\#ffffff, 75%\` |


  Other Colors:

  | Name           | Hex       |

  | :------------- | :-------- |

  | Green Success  | \`\#66cc99\` |

  | Green Text     | \`\#528232\` |

  | Yellow Warning | \`\#ffd580\` |


  ### **Branding Typography**

  Follow the established Sugarwish typography guidelines:

* MonteCarloPro: Exclusively for the Sugarwish logo and tagline ("sweet happiness delivered."). Do not use for UI text.  
* Lato (Primary Font \- Regular & Bold): Use Lato Regular for body text, paragraphs, and general content. Use Lato Bold for emphasis within text or secondary headings.  
* Montserrat (Secondary Font \- Regular, Bold, Black): Use Montserrat Regular or Bold for primary headings (H1, H2, etc.). Use Montserrat Black for high-impact elements like major Calls to Action or key interface titles. Use Montserrat (Regular/Bold) for buttons and short feature titles.


  ## **7\. Potential Roadblocks & Future Functionalities**

  ### **Potential Roadblocks**

* POP Email Connection: Difficulty or complexity in establishing reliable POP connection for Gmail/email integration to reflect full inbound and outbound history within the CRM. Requires investigation and potentially alternative approaches (e.g., API-based integration if available, manual logging).


  ### **Future Functionalities (Post-MVP / Phase 4+)**

* **Bulk Data Operations:**  
  *  Importing bulk tasks.  
  *  Importing/exporting bulk contact/user updates.  
  *  Importing/exporting bulk organization/company updates.  
* Reply.io Integration/Replacement: Functionality similar to reply.io (sales engagement platform) enabling sending emails/sequences directly from CRM instead of via reply.io.  
* Webhooks for when certain fields are updated \- add here and then move to one of the above locations.  
* Being able to email, text or message contact from CRM \- pull recent contact history  
* Send sugarwish from GC sample account )or main sample account \- directly from CRM to contact \- then add a completed touch point  
* Alias emails  
* If email is changed push to retool table to compare billing table email and get approval  
* GC side reporting  
  * With drill down visuals/charts/cards/details/customizeable?   
* Task view filters (and how to incorporate sidekick views)  
* Maybe have new direct leads added automatically and have a “dibs” list  
* Be able to send quotes, proposals, emails, messages, texts,   
* Events (calendly / trainings) \- api  
* Have python auto update certain fields when changing specific fields, rather than triggering a webhook.   
* Have Seth or API write out how different languages (Python, JS, etc) communicate with and interact with one another.  
* LLM last storing \- Ronald to update  
  