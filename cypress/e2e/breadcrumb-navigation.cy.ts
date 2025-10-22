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
        // Expand the folder-tree
        cy.get('[data-testid="folder-tree-folder-TestUser"] button').within(() => {
            cy.get('svg').click(); // Collapse
          }); 
        cy.wait(1000);

        // navigate to test folder-1
        cy.get('[data-testid="folder-tree-folder-Test Folder 1"]').click();
        cy.wait(1000);
        cy.url().should('include', '/folders/');
        cy.get('tbody').should('be.empty');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'TestUser');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'Test Folder 1');

        // navigate back using the breadcrumb
        cy.get('[data-testid="breadcrumb"]').within(() => {
            cy.contains('TestUser').click();
            cy.wait(1000);
        });

        // assert that we have gotten what we want 
        cy.contains('Test Folder 1').should('be.visible');
        cy.contains('Test Folder 2').should('be.visible');
    });
});