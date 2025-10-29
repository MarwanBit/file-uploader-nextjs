describe('Folder Creation', () => {

    beforeEach(() => {
        cy.cleanupDatabase();
        cy.wait(1000);
        cy.cleanupClerkUsers();
        cy.wait(1000);
    });

    afterEach(() => {
        cy.cleanupDatabase();
        cy.wait(1000);
        cy.cleanupClerkUsers();
        cy.wait(1000);
    });


    it('should create a new folder successfully', () => {
        // First, sign up a test user
        cy.signupClerkTestUser();  
        // Verify we're on the folders page
        cy.url().should('include', '/folders');
        cy.createFolder('My Test Folder').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });
    });
});