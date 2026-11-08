# CHANGELOG

## 1.3.0

This release has 1 new feature and 4 documentation changes. 6 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### New

- add a Report a bug command

### Documentation

- **readme:** point bug reports at the Report a bug command
- add issue-filing instructions for AI agents
- **readme:** combine related resources and plugin comparisons
- add a Similar plugins section to the README

## 1.2.23

This release has 3 documentation changes. 5 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Documentation

- shorten the debugging section
- **readme:** lead the Debugging section with `Advanced Debug Mode`
- mark plugin names as code

## 1.2.22

This release has 1 documentation change. 3 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Documentation

- merge marking plugin names as code in docs and comments

## 1.2.21

This release has 4 fixes and 5 documentation changes. 16 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Fixed

- **test:** merge the headless demo-vault toolkit install
- **deps:** restore the lockfile's missing resolved and integrity fields
- **deps:** float devalue to 5.9.4, clearing GHSA-9rgm-9g3h-6x36
- **build:** wire build:compile to buildCompile and drop the duplicate leaf script

### Documentation

- drop the rule-id citations from the pin table
- **changelog:** name `obsidian-dev-utils` by its package name
- replace the private tracker references with what they pointed at
- say where the debug command is run
- name the unversioned demo-vault asset and the folder it unzips into

## 1.2.20

This release has 2 fixes. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

### Fixed

- **deps:** move to `obsidian-integration-testing` 11 and `obsidian-dev-utils` 96.5.2
- **deps:** drop the brace-expansion file: override that breaks a clean install

## 1.2.19

This release has 1 fix and 6 documentation changes. 8 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Fixed

- override deepmerge-ts to clear GHSA-ggr8-5vv4-36mx

### Documentation

- **demo-vault:** unwrap the notes so Obsidian stops rendering a break per line
- **readme:** render the same in Obsidian's plugin page as on `GitHub`
- describe the plugin by the defect it actually fixes
- resolve the numbers in the screenshot alt text
- correct the plugin's described behavior and add demo buttons
- capture the community-store screenshot set

## 1.2.18

This release has 1 documentation change.

### Documentation

- make the demo vault the documentation, in the standard layout

## 1.2.17

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.16

This release has 1 documentation change. 4 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Documentation

- fix the demo vault download instructions

## 1.2.15

This release has maintenance changes only. 2 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

## 1.2.14

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.13

This release has 1 fix. 2 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

### Fixed

- **demo-vault:** export invoke() from startup script; add Invocables folder

## 1.2.12

This release has 5 documentation changes. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

### Documentation

- standardize demo-vault README
- drop per-plugin demo-vault setup notes (bootstrap covered by the `obsidian-dev-utils` harness)
- **demo-vault:** create the `Fix Tab Size` demo vault
- update
- migrate to AGENTS.md

## 1.2.11

This release has maintenance changes only. 6 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

## 1.2.10

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.9

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.8

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.7

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.6

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.5

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.4

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.3

This release has maintenance changes only. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

## 1.2.2

This release has maintenance changes only. 3 maintenance commits (tests, build, CI, refactoring, dependencies) are not listed.

## 1.2.1

This release has 1 fix. 1 maintenance commit (tests, build, CI, refactoring, dependencies) is not listed.

### Fixed

- build

## 1.2.0

This release has 1 new feature.

### New

- update tab size for open views

## 1.1.0

This release has 1 new feature.

### New

- patch if any markdown view is open

## 1.0.0

This release has 1 new feature.

### New

- initial implementation
