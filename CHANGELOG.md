# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2025-07-02

### Added
- support sorting the grade table on header click fully
- support interation with withdrawn courses
- add linter tools and pre-commit hooks
- add release script
- add relase CI workflow

### Changed
- split script.js by features
- extract column indexing as configuration items

### Fixed
- adjusted grade table column indexing
- sync of sortTable and header icons of grade table
- various bug fixes

### Removed
- multi sort feature

## [1.3.1] - 2025-03-20

### Fixed
- grade column adjustment

## [1.3.0] - 2025-03-25

### Added
- export grades
- partially support the sorting of grade table

### Changed
- reformat code
- add extension prefix to all CSS selectors

## [1.1.7] - 2022-03-18

### Added
- responsive UI
- sort the fetched scores by acadamic year, semester and course category for a better ux
- add the ability to calc average score and average GPA
- auto detect inter-faculty course and all the course categories
- complete support for different course categories selection and deselection
- add support to show statistics info (credits count by category, score trending plot)
- add popup to show meta info

[Unreleased]: https://github.com/whaliendev/WHU-GPA-helperX/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/whaliendev/WHU-GPA-helperX/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/whaliendev/WHU-GPA-helperX/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/whaliendev/WHU-GPA-helperX/compare/v1.1.7...v1.3.0
[1.1.7]: https://github.com/whaliendev/WHU-GPA-helperX/releases/tag/v1.1.7
