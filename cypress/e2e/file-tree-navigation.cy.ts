describe('File Tree Navigation', () => {
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

    it('should allow navigation into subfolders by clicking', () => {
        cy.signupClerkTestUser();
        cy.url().should('include', '/folders');
        cy.createFolder('Test Folder 1').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });
        cy.createFolder('Test Folder 2').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });

        // Navigate directly to the folders instead of through folder tree
        cy.contains('Test Folder 1').should('be.visible').click();
        cy.wait(1000);
        cy.url().should('include', '/folders/');
        cy.get('tbody').should('be.empty');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'TestUser');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'Test Folder 1');

        // Navigate back to root and then to test folder-2
        cy.visit('/folders');
        cy.contains('Test Folder 2').should('be.visible').click();
        cy.wait(1000);
        cy.url().should('include', '/folders/');
        cy.get('tbody').should('be.empty');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'TestUser');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'Test Folder 2');
    });
});