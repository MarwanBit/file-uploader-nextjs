describe('File Deletion', () => {
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

    it('should allow file deletion', () => {
        cy.signupClerkTestUser();
        cy.url().should('include', '/folders');
        cy.createFolder('Test Folder 1').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });
        
        // Skip folder navigation for now - test file deletion in root folder
        // The folder creation already happened, so we're in the root folder
        cy.url().should('include', '/folders');
        cy.get('[data-testid="breadcrumb"]').should('be.visible');

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

        // now we want to click on the file
        cy.contains("test-file.txt").click();

        // Intercept the API call to get the S3 URL
        cy.intercept('DELETE', '/api/files/*').as('deleteFile');

        // Now we confirm we want to delete 
        cy.wait(1000);

        cy.get('[data-testid="file-sidebar"]', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="file-sidebar"]').within(() => {
            cy.contains("Delete").click();
        });

        cy.get('[role="alertdialog"]').within(() => {
            cy.contains('button', 'Delete').click();
        });

        // Get the S3 presigned URL from the API response
        cy.wait('@deleteFile').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            expect(interception.response.body).to.have.property('message', 'deletion successful!');
        });

        cy.reload();
        cy.get('tbody').should('not.contain', 'test-file.txt');
    });
});