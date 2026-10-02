# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-10-01

### Added
- Optional `apiKey`, sent as the `x-api-key` header, for the developer sandbox and for calls that authenticate with a key
- `WestFax.PRODUCTION_BASE_URL` (`https://api2.westfax.com`) and `WestFax.SANDBOX_BASE_URL` (`https://integrate.westfax.com`)
- `getFaxIdentifiers`, `getFaxDescriptions`, `getFaxUsage`, and `searchFaxes`
- Multiple documents on `sendFax` through `files`
- A 120 second request timeout, configurable with `timeout`, and no default body size cap
- `WestFaxError` for validation failures and HTTP failures. HTTP errors still expose `error.response`

### Fixed
- Callbacks are posted as `CallBackUrl`, which is the field the API reads
- `getFaxDescriptionsUsingIds` sends `FaxIds1`…`FaxIds10` instead of a single `FaxIds` value
- Removed the extra `ContentType` header that was sent beside the real multipart `Content-Type`
- Requests use `/rest/`, which works on production and on the case-sensitive sandbox
- `getProductId` no longer writes to the console

### Changed
- Dependencies are current, including axios 1.20.0 and form-data 4.0.6
- Node 18 or newer is required
- The default host is still `https://apisecure.westfax.com`, which remains live. Set `baseUrl` to `WestFax.PRODUCTION_BASE_URL` to use the host in the current WestFax docs
- `npm test` exercises the client with a mocked HTTP layer and does not send faxes. `npm run test:real` calls the live API

## [1.0.3] - 2024-02-26

### Added
- Merged single and multi functions

## [1.0.0] - 2024-02-25

### Added
- Initial release of the WestFax NPM module
- Core functionality for interacting with the WestFax Secure Cloud Fax API
- Methods for sending faxes to single or multiple recipients
- Methods for retrieving fax documents and managing fax filter values
- Comprehensive documentation and examples
- TypeScript type definitions
