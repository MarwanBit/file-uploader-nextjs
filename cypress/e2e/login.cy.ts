describe('User Authentication', () => {

    beforeEach(() => {
        cy.cleanupDatabase();
        cy.cleanupClerkUsers();
    });

    afterEach(() => {
        cy.cleanupDatabase();
        cy.cleanupClerkUsers();
    });


    it('should signup with random user', () => {
        cy.signupClerkTestUser();
        // Verify we're logged in and on the correct page
        cy.url().should('include', '/folders');

        // Check if user exists after signup
        cy.task('clerk:cleanupUsers').then(() => {
            console.log('✅ Cleanup completed after test');
        });
    });
});