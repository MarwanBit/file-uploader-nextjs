describe('Breadcrumb Navigation', () => {
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

    it("should allow navigation by clicking on the directory breadcrumb components", () => {
        cy.signupClerkTestUser();
        cy.url().should('include', '/folders');
        
        cy.createFolder('Test Folder 1').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });
        cy.createFolder('Test Folder 2').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });
        // Instead of navigating through folder tree, navigate directly to the folder
        // First, get the folder ID by looking for the folder in the main content area
        cy.contains('Test Folder 1').should('be.visible').click();
        cy.wait(1000);
        cy.url().should('include', '/folders/');
        cy.get('tbody').should('be.empty');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'TestUser');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'Test Folder 1');

        // navigate back using the breadcrumb
        cy.get('[data-testid="breadcrumb"]').within(() => {
            cy.get('a[href*="/folders/"]').first().click();
            cy.wait(1000);
        });

        // assert that we have gotten what we want 
        cy.contains('Test Folder 1').should('be.visible');
        cy.contains('Test Folder 2').should('be.visible');
    });
});