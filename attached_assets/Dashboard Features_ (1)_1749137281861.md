## **Product Requirements Document: Gift Concierge (GC) Dashboard**

**1\. Introduction**

This document outlines the requirements for a new Gift Concierge (GC) Dashboard. The dashboard will serve as a central hub for GCs (Sales Reps) to track their sales performance, estimated bonuses, assigned domains, and open opportunities. It aims to provide actionable insights and quick access to relevant data, empowering GCs to monitor their progress and manage their sales activities effectively.

**2\. Goals**

* Provide GCs with a clear and real-time overview of their individual sales performance.  
* Enable GCs to compare their performance against other team members.  
* Offer GCs an estimate of their potential bonuses.  
* Allow GCs to efficiently manage and analyze their assigned domains and associated company data.  
* Provide GCs with a view of high-value, open opportunities to help prioritize efforts.  
* Improve GC productivity by consolidating key information into a single, easily accessible interface.

**3\. Target Users**

* Gift Concierges (GCs) / Sales Representatives at the company.

**4\. User Stories**

* **Sales Performance Tracking:**  
  * As a GC, I want to see my Month to Date (MTD) sales revenue so that I can track my current performance.  
  * As a GC, I want to be able to drill down into my MTD sales to see which users/companies placed orders, the amount they spent, and the date of the order, so I can understand the details of my sales.  
  * As a GC, I want to see my sales revenue from last month so that I can compare it to my current performance.  
  * As a GC, I want to be able to drill down into my last month's sales to see specific user/company transactions, amounts, and dates.  
  * As a GC, I want to see my sales revenue from two months ago so that I have a broader view of my recent performance.  
  * As a GC, I want to be able to drill down into my sales from two months ago to see specific user/company transactions, amounts, and dates.  
* **Team Performance Comparison:**  
  * As a GC, I want to see a comparison of sales performance and rank for all GCs for the current Month to Date, so I understand my standing within the team.  
  * As a GC, I want to be able to filter the team comparison view to show or hide specific GCs, so I can focus on relevant comparisons.  
* **Bonus Estimation:**  
  * As a GC, I want to see my estimated Month to Date bonus (calculated as 1.7% of my MTD sales) so that I can understand my potential earnings.  
  * As a GC, I want to see my estimated bonus from last month (calculated as 1.7% of last month's sales) so that I can track my earnings over time.  
  * As a GC, I want to see a note indicating that bonus numbers are not final and are contingent on billing review, so I have accurate expectations.  
* **Domain Management:**  
  * As a GC, I want to see a table of domains assigned to me, showing the count of companies at each domain (top 50, descending), so I can understand the distribution of my accounts.  
  * As a GC, I want to be able to filter my assigned domains table by lifetime revenue, last 12 months revenue, last 3 months revenue, last month revenue, and month-to-date revenue for individual domains, so I can identify high-performing or declining domains.  
  * As a GC, when I drill down into a domain, I want to see specific organization names, recent inbound activity (from Insightly), most recent order purchase date, most recent credit purchase date, and the sales revenue numbers (MTD, Last Month, Last 3 Months, Last 12 Months, Lifetime) for individual organizations/accounts, so I have a comprehensive view of account activity within that domain.  
* **Opportunity Tracking:**  
  * As a GC, I want to see a table of my open opportunities with values greater than $2000, so I can focus on high-value deals.  
  * As a GC, I want to see the estimated ship date (ascending), state (open), date of last activity on contact, and date of next activity on contact for these opportunities, so I can stay on top of my pipeline.  
  * As a GC, I want to be able to click a link that takes me to the opportunity in Insightly (opening in a new tab), for more detailed information.

**5\. Features (Functional Requirements)**

**5.1. Sales Revenue Table** \* Displays sales revenue for the logged-in GC. \* Metrics to include: \* **Month to Date Sales**: \* Data pulled via a specific SQL query for the GC's company/users. \* Drill-down capability: Displays a detailed view showing the exact user/company, amount spent, and date of order for the current month. \* **Last Month Sales**: \* Data pulled via a specific SQL query for the GC's company/users. \* Drill-down capability: Displays a detailed view showing the exact user/company, amount spent, and date of order for the previous month. \* **2 Months Ago Sales**: \* Data pulled via a specific SQL query for the GC's company/users. \* Drill-down capability: Displays a detailed view showing the exact user/company, amount spent, and date of order for two months prior.

**5.2. Whole Team Comparison of Sales / Rank** \* Displays the rank and Month to Date sales amount for each GC. \* Includes filters to add or remove visibility of specific GCs on this dashboard card.

**5.3. Estimated Bonus Table** \* Displays estimated bonus for the logged-in GC. \* Metrics to include: \* **Month to Date Bonus**: Calculated as 1.7% of the GC's MTD Sales. \* **Last Month Bonus**: Calculated as 1.7% of the GC's Last Month Sales. \* A note will be displayed: "numbers aren’t final and are contingent of billing review".

**5.4. Table Reflecting Domains Assigned to GC** \* Shows a count of companies at each domain assigned to the logged-in GC. \* Table should display the top 50 domains, sorted in descending order by company count. \* Data pulled via a specific SQL query. \* Filter capabilities for the table based on: \* Lifetime revenue at individual domains. \* Last 12 months revenue at individual domains. \* Last 3 months revenue at individual domains. \* Last month revenue at individual domains. \* Month to date revenue for individual domains. \* Drill-down capability for each domain to show: \* Specific organization names. \* Recent inbound activity (pulled from Insightly). \* Most recent order purchase date. \* Most recent credit purchase date. \* Sales revenue numbers for the individual organizations/accounts (presumably MTD, Last Month, Last 3 Months, Last 12 Months, Lifetime, consistent with domain filters).

**5.5. Table Reflecting Open Opportunities** \* Displays open opportunities with values greater than $2000. \* Information to display for each opportunity: \* Estimated ship date (sorted ascending). \* State (must be "open"). \* Date of last activity on contact. \* Date of next activity on contact. \* A link to the opportunity in Insightly, which opens in a new browser tab.

**6\. Data Requirements / Backend Considerations**

* Sales data (MTD, Last Month, 2 Months Ago) will be sourced from SQL queries specific to the GC's company/users. These queries will be provided.  
* Domain assignment and company count data will be sourced from a SQL query. This query will be provided.  
* Revenue data for domains (Lifetime, Last 12 months, etc.) will require appropriate SQL queries or data processing.  
* Opportunity data, including estimated ship date, state, activity dates, and Insightly links, will need to be sourced, potentially from Insightly via API or database integration.  
* Recent inbound activity for domain drill-downs will be pulled from Insightly.  
* The system must support user authentication to display data relevant to the logged-in GC.

**7\. Design and UX Considerations**

* **Dashboard Cards**: Each main feature (Sales Revenue, Team Comparison, Estimated Bonus, Assigned Domains, Open Opportunities) should be presented as a distinct card or section within the dashboard for clarity.  
* **Drill-Down Functionality**: Key metrics and tables (Sales Revenue, Assigned Domains) must allow users to click to see more detailed information as specified.  
* **Filtering**: Filters should be clearly labeled and easy to use for the Team Comparison and Assigned Domains tables.  
* **Data Visualization**: Consider appropriate visualizations (e.g., tables, perhaps progress bars for sales goals if applicable in the future) for presenting data clearly.  
* **Responsiveness**: The dashboard should be designed to be usable across common screen resolutions used by GCs.  
* **Performance**: Dashboard loading and data retrieval (especially for drill-downs and filtered views) should be optimized for a good user experience.  
* **Clarity of Information**: Financial figures and dates should be clearly formatted. The note regarding bonus finality must be prominently displayed.  
* **External Links**: Links to Insightly should open in a new tab to prevent users from losing their place in the dashboard.

**8\. Future Considerations / Out of Scope (for this iteration)**

* The specific SQL queries for sales and domain data are pending and will be provided separately. Integration of these queries is in scope once they are available.  
* Advanced data visualizations beyond tables (e.g., charts, graphs) are not explicitly requested in this version but could be considered for future enhancements.  
* Real-time notifications for new high-value opportunities or significant sales events.  
* Goal setting and tracking features for GCs.

**9\. Success Metrics**

* High adoption rate of the dashboard by GCs.  
* Positive feedback from GCs regarding usability and usefulness.  
* Reduction in time spent by GCs manually gathering sales and domain information.  
* Observed improvement in GC engagement with their sales data and opportunities.

---

**Note:** GC means Gift Concierge, which is the company's definition for a Sales Rep.

