/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      signupClerkTestUser(): Chainable<{ email: string; password: string }>
      loginClerkTestUser(): Chainable<{ email: string; password: string }>
      cleanupClerkUsers(): Chainable<void>
      cleanupDatabase(): Chainable<void>
      createFolder(folderName?: string): Chainable<string>
    }
  }
}

Cypress.Commands.add('signupClerkTestUser', () => {
    cy.fixture('test-users').then((users) => {
        const user = users['testUser'];
        cy.visit('/signup')
  
        // Wait for Clerk to load
        cy.get('input[name="firstName"]', { timeout: 15000 }).should('be.visible');
        // Fill form
        cy.get('input[name="firstName"]').type(user.firstName);
        cy.get('input[name="lastName"]').type(user.lastName);
        cy.get('input[name="emailAddress"]').type(user.email);
        cy.get('input[name="password"]').type(user.password);
        // Wait for form validation
        cy.wait(2000);
        // Click the primary button
        cy.get('button.cl-formButtonPrimary').click();
        // Wait for redirect
        cy.url({ timeout: 15000 }).should('include', '/folders');

        // Return user data for use in tests
        return cy.wrap({ email: user.email, password: user.password });
    });
});

Cypress.Commands.add('loginClerkTestUser', () => {
    cy.fixture('test-users').then((users) => {
        const user = users['testUser'];
        cy.visit('/login')
  
         // Wait for Clerk to load
        cy.get('input[name="emailAddress"]', { timeout: 15000 }).should('be.visible');
        
        // Fill login form
        cy.get('input[name="emailAddress"]').type(user.email);
        cy.get('input[name="password"]').type(user.password);
        
        // Click login button
        cy.get('button.cl-formButtonPrimary').click();
        
        // Wait for redirect
        cy.url({ timeout: 15000 }).should('include', '/folders');

        // Return user data for use in tests
        return cy.wrap({ email: user.email, password: user.password });
    });
});

// 3. Cleanup Clerk Users
Cypress.Commands.add('cleanupClerkUsers', () => {
    cy.task('clerk:cleanupUsers')
  })
  
// 4. Cleanup Database
Cypress.Commands.add('cleanupDatabase', () => {
  cy.task('db:clean')
})

// 5. Create Folder
Cypress.Commands.add('createFolder', (folderName?: string) => {
  const finalFolderName = folderName || `Test Folder ${Date.now()}`;
  
  // Click the new folder button
  cy.get('[data-testid="new-folder-button"]').click();
  
  // Wait for the AlertDialog to appear
  cy.get('[role="alertdialog"]', { timeout: 10000 }).should('be.visible');
  
  // Enter folder name
  cy.get('input[placeholder="Enter your folder name..."]').type(finalFolderName);
  
  // Click create button
  cy.get('button').contains('Create Folder').click();
  
  // Wait for dialog to close
  cy.get('[role="alertdialog"]').should('not.exist');
  
  // Wait for page reload
  cy.wait(3000);
  
  // Verify folder appears
  cy.contains(finalFolderName).should('be.visible');
  
  // Return the folder name for use in other tests
  return cy.wrap(finalFolderName);
})