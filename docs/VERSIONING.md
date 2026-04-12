# API Versioning & Evolution Strategy

This document outlines how the Skill Workshop Management System API handles versioning and how it will evolve from `/v1` to `/v2` when breaking changes are introduced.

## Current Version: `/v1`
All current endpoints are prefixed with `/api/v1`. This version is considered stable and provides the core functionality of the workshop management system.

## Handling Breaking Changes
A breaking change is any modification that could break existing client applications. Examples include:
- Removing or renaming an endpoint.
- Changing the data structure of a response.
- Making a previously optional field mandatory in a request.
- Changing the status code for a specific outcome.

### Transitioning to `/v2`
When breaking changes are necessary, we will introduce a new version prefix: `/api/v2`.

1.  **Parallel Versions**: Both `/v1` and `/v2` will coexist for a transition period (e.g., 6 months).
2.  **Shared Logic**: Common, non-breaking logic will be shared between versions to minimize maintenance.
3.  **Deprecation Notice**: `/v1` responses will include a `Warning` or `X-API-Deprecation-Date` HTTP header to notify clients.
4.  **Documentation**: Swagger/OpenAPI documentation will provide separate specifications for each version.

## Non-Breaking Changes
Non-breaking changes will be rolled out directly to the current version. These include:
- Adding new endpoints.
- Adding optional fields to request bodies.
- Adding new fields to response objects.

## Versioning via Headers (Alternative)
While we currently use URL-based versioning, we can also support versioning via the `Accept` header:
`Accept: application/vnd.skillworkshop.v2+json`

This approach keeps URLs "clean" but can be more complex for some clients to implement.

## Deprecation Policy
1.  **Announcement**: We will announce the deprecation of a version via GitHub releases and the API developer portal.
2.  **Sunset Period**: A minimum of 6 months will be given before a version is retired.
3.  **Hard Sunset**: After the sunset period, requests to the old version will return `410 Gone`.
