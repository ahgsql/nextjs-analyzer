# Contributing Guide

Thank you for your interest in contributing to the Next.js Analyzer project! This guide explains how you can contribute to the project.

## Development Environment Setup

1. Fork and clone the project:

```bash
git clone https://github.com/[your-username]/nextjs-analyzer.git
cd nextjs-analyzer
```

2. Install dependencies:

```bash
npm install
```

3. Run the project locally:

```bash
npm start
```

## Modular Structure

Next.js Analyzer has a modular structure. Each analysis module is located in its own directory under the `src/modules` directory. Follow this structure when adding a new module.

### Module Structure

A module should have the following structure:

```javascript
module.exports = {
  name: 'module-name',
  description: 'Module description',
  
  async analyze(analyzer, options) {
    // Analysis process
    return {
      results: {
        // Analysis results
      },
      metadata: {
        // Analysis metadata
      }
    };
  },
  
  visualize: {
    text(results) {
      // Text format visualization
      return 'Text visualization';
    },
    
    html(results) {
      // HTML format visualization
      return '<div>HTML visualization</div>';
    },
    
    json(results) {
      // JSON format visualization
      return JSON.stringify(results, null, 2);
    }
  }
};
```

## Adding a New Module

1. Create a new folder under the `src/modules` directory:

```bash
mkdir src/modules/your-module-name
```

2. Create the `src/modules/your-module-name/index.js` file and follow the module structure.

3. Add your module to the `src/modules/index.js` file:

```javascript
const component = require('./component');
const performance = require('./performance');
const security = require('./security');
const seo = require('./seo');
const dataFetching = require('./data-fetching');
const codeQuality = require('./code-quality');
const routing = require('./routing');
const visualization = require('./visualization');
const history = require('./history');
const yourModuleName = require('./your-module-name');

module.exports = {
  component,
  performance,
  security,
  seo,
  'data-fetching': dataFetching,
  'code-quality': codeQuality,
  routing,
  visualization,
  history,
  'your-module-name': yourModuleName
};
```

4. Test your module:

```bash
npm start analyze --module your-module-name
```

## Code Style

Follow these code style guidelines when contributing to the project:

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes
- Use camelCase for variable and function names
- Document functions with JSDoc

## Commit Messages

Write your commit messages in the following format:

```
[module-name]: Short description

Long description (if needed)
```

Example:

```
[security]: Added API route security check

- Added CORS configuration check
- Added rate limiting check
- Added authentication check
```

## Pull Request Process

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

2. Commit your changes:

```bash
git commit -m "[module-name]: Short description"
```

3. Push your branch:

```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request on GitHub.

5. Your Pull Request will be reviewed, and changes may be requested.

6. After your Pull Request is approved, your changes will be merged into the main branch.

## Issues and Feature Requests

You can report issues and feature requests through GitHub Issues. Please use the following templates:

### Issue Report

```
## Issue Description
[Briefly describe the issue]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[Describe the expected behavior]

## Actual Behavior
[Describe the actual behavior]

## Environment
- Operating System: [Operating system]
- Node.js Version: [Node.js version]
- Next.js Analyzer Version: [Next.js Analyzer version]
```

### Feature Request

```
## Feature Description
[Briefly describe the feature]

## Use Case
[Explain how this feature would be used]

## Alternative Solutions
[Describe alternative solutions, if any]
```

## License

By contributing to the project, you agree that your contributions will be licensed under the MIT license.
