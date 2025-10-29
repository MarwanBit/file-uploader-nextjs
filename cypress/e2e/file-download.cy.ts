describe('File Download', () => {
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

    it('should allow file download', () => {
        cy.signupClerkTestUser();
        cy.url().should('include', '/folders');
        cy.createFolder('Test Folder 1').then((folderName) => {
            cy.contains(folderName).should('be.visible');
        });
        
        // Skip folder navigation for now - test file download in root folder
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
         // now let's download the file
         // Stub window.open to capture the URL
        cy.window().then((win) => {
            cy.stub(win, 'open').as('windowOpen');
        });

        // Click download
        cy.contains("Download").click();

        // Intercept the API call to get the S3 URL
        cy.intercept('GET', '/api/files/*').as('getFileUrl');

        // Click download
        cy.contains("Download").click();

        // Get the S3 presigned URL from the API response
        cy.wait('@getFileUrl').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            
            const s3Url = interception.response.body.url; // or however it's structured
            
            // Now request the actual file from S3
            cy.request(s3Url).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body).to.include('This is a test file content');
            });
        });
    });
})