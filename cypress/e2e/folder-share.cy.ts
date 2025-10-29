describe("Folder Share", () => {
    
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

    it("should verify that folder share works", () => {
        cy.signupClerkTestUser();
        cy.url().should('include', '/folders');
        cy.createFolder('Test Folder 1');
        cy.createFolder('Test Folder 2');
        cy.createFolder('Test Folder 3');
        
        // Reload to ensure all folders are visible
        cy.wait(1000);
        cy.reload();
        
        // Verify folders are visible
        cy.contains('Test Folder 1', { timeout: 10000 }).should('be.visible');
        cy.contains('Test Folder 2', { timeout: 10000 }).should('be.visible');
        cy.contains('Test Folder 3', { timeout: 10000 }).should('be.visible');

        // Skip folder navigation for now - test folder share in root folder
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
         cy.get('tbody', { timeout: 10000 }).should('contain', "test-file.txt");
         
         // Verify the file is clickable/selectable
         cy.contains("test-file.txt").should('be.visible');

         // Set up the intercept BEFORE clicking Share
         cy.intercept('POST', '/api/folders/*/share').as('shareFolder');

         cy.get('[data-testid="share-folder-button"]', { timeout: 10000 }).should('be.visible');
         cy.get('[data-testid="share-folder-button"]').click();

         cy.get('[role="alertdialog"]', { timeout: 10000 }).should('be.visible');
         cy.get('[role="alertdialog"]').within(() => {
            cy.contains("1 day").click();
            cy.contains("Generate Link").click();
         });

         // Wait for the share API call to complete
         cy.wait('@shareFolder').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            console.log('File share API response:', interception.response.body);
         });

         // Wait for the input field to be populated
        cy.get('[role="alertdialog"]').within(() => {
            cy.get('input[type="text"]').should('not.have.value', '');
        });

        // Extract the link value OUTSIDE of .within() context
        cy.get('[role="alertdialog"] input[type="text"]').invoke('val').then((shareLink) => {
            // Close the dialog - look for either Cancel or Close button
            cy.get('[role="alertdialog"]').within(() => {
                cy.get('button').contains(/Cancel|Close/).click();
            });
            
            // Wait for dialog to close
            cy.get('[role="alertdialog"]').should('not.exist');
            
            // Request the presigned S3 URL to get the file content
            cy.visit(shareLink as string);
            cy.contains("Test Folder 1", { timeout: 10000 }).should('be.visible');
            cy.contains("test-file.txt", { timeout: 10000 }).should('be.visible');
        });

    });
}) 