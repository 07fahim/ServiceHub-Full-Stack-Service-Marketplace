**AI Engineer – Technical Assessment**

This assessment is designed to evaluate practical AI engineering, workflow automation, machine learning, and full-stack application integration. Candidates should focus on robust system architecture, clean implementation, and clear documentation over visual polish.

**Final Submission Deadline: 21 June 2026, 11:59 pm**

**Allowed Tech Stack:** Candidates may choose their preferred tools and programming languages unless explicitly stated otherwise.


**Assessment 4: Full-Stack Service Marketplace (Vibe Coding Challenge) Objective**

Demonstrate the ability to efficiently direct AI development tools (e.g., Cursor, GitHub Copilot, Devin) to rapidly architect and deploy a secure, multi-tenant web application.

**Task**

Rapidly build the core backend, frontend, and database functionality of a multi-vendor service marketplace platform (inspired by systems like Sheba.xyz). While you are encouraged to heavily leverage AI coding tools ("vibe coding"), you are entirely responsible for ensuring the application actually runs, links together correctly, and implements all requested business logic.

**Core Implementation Requirements:**

∙ **Authentication & Role-Based Access Control (RBAC):** Secure user management supporting three distinct system roles: **Admin**, **Vendor**, and **End-User**.

∙ **Profile Ecosystem:**  
o _End-User Profile:_ Ability to browse available services and view personal service/order history.

o _Vendor Profile:_ Dedicated dashboard to list services, manage pricing, and view received jobs.

∙ **Service Discovery:** A searchable marketplace catalog broken down into distinct categories where users can search for and select service offerings from various vendors. ∙ **Checkout & Simulated Processing:** A complete checkout journey allowing an end-user to book a vendor's service, passing through a mock payment gateway integration operating inside a sandbox/test environment.

**Must Explain**

∙ Your "vibe coding" engineering workflow: How did you structure your prompts? Where did the AI tools succeed, and where did they fail or hallucinate code that required your manual intervention?

∙ The entity-relationship diagram (ERD) or database schema linking Users, Vendors, Services, and sandbox Transactions together safely.  
∙ State management and route protection practices implemented across the frontend and API layers.

**Deliverables**

∙ **GitHub Repository:** Public link displaying separate frontend and backend application directories, including detailed commit history tracking the construction of the application modules.

∙ **Setup Instructions:** Comprehensive setup guides, setup scripts, or seed data parameters to launch and navigate the app locally.

∙ **Demo Video:** A recorded video link taking the reviewer through the final multi-tenant system. Log in securely using different role types, search and select services from the marketplace catalog, complete a checkout via the sandbox environment, and verify that the data reflects properly across the vendor and user profiles.
