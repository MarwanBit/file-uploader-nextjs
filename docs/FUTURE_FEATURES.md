# Future Features/ Considerations

For more detailed architectural improvements checkout the second to last section of **ARCHITECTURE.md**. 

#### UI/UX Improvements

* Loading States/ Skeletons for all components.
* More comprehensive error handling/ error boundaries in the UI.
* More detailed error handling using custom errors and error responses.
* Custom not found page.
* Optimistic Updates.
* Get rid of root page/ have it reroute to the signup/ login pages.

#### Concurrency Control

* Testing to make sure concurrency doesn't lead to errors.
* Lock write access to files and folders for deletes, perhaps try using transactions.

#### Syncing

* Allow concurrent file and folder creation, using something like CRDT's to sync state when it is updated on a different client.

#### Other Features

* Drag-and-drop file uploads.
* Support multiple file uploads simultaneously.
* File preview and metadata extraction.
* Allow file share and multiple upload for different users.
* User-based-authentication control for sharing folder and files instead of shared vs not-shared.

#### Future Features

- Implement retry logic for failed operations
- Enhanced error logging and monitoring integration (e.g., Sentry)
- Implement caching layer (Redis) for frequently accessed folder structures.
- Add pagination for folders with large numbers of files.
- Optimize database queries with proper indexing strategies.
- Implement lazy loading for folder tree navigation.
- Consider using Prisma Accelerate for connection pooling and global caching.
- **Search & Discovery:** Full-text search across file names and metadata, advanced filtering options
- **Storage Management:** User storage quotas, storage usage analytics, automated cleanup of expired shares
- Add comprehensive application monitoring (APM)
- Implement log aggregation and analysis
- Set up alerting for critical errors
- Performance monitoring and optimization tools
