describe('File Upload', () => {
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

    it('should successfully upload a file', () => {
        cy.signupClerkTestUser();
        cy.url().should('include', '/folders');
        cy.createFolder('Test Folder 1').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });
        
        // Skip folder navigation for now - test file upload in root folder
        // The folder creation already happened, so we're in the root folder
        cy.url().should('include', '/folders');
        cy.get('[data-testid="breadcrumb"]').should('contain', 'TestUser');

        // Now let's click the new folder button
        cy.intercept('POST', '/api/folders/*/files').as('uploadFile');
        cy.get('[data-testid="new-file-button"]').click();
        cy.get('[role="alertdialog"]', { timeout: 10000 }).should('be.visible'); 
        
        cy.get('input[type="file"]').selectFile({
            contents: Cypress.Buffer.from("This is a test file content"),
            fileName: 'test-file.txt',
            mimeType: 'text/plain'
        });

        cy.get('input[type="file"]').trigger('change', { force: true });

        cy.wait(1000);

        cy.get('button').contains('Upload File').click();

        // Wait for the API call to complete
        cy.wait('@uploadFile').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            console.log('File upload API response:', interception.response.body);
        });

         // Wait for the dialog to close
         cy.get('[role="alertdialog"]').should('not.exist');
        
         // Wait for page to reload/update
         cy.wait(2000);

         cy.reload();
         
         // Verify the file appears in the table
         cy.get('tbody').should('contain', "test-file.txt");
         
         // Verify the file is clickable/selectable
         cy.contains("test-file.txt").should('be.visible');
    });
});