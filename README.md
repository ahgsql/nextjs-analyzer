# Next.js Analyzer

A modular tool that comprehensively analyzes Next.js projects. Includes component, performance, security, SEO, data fetching, code quality, and historical analysis features.

![Next.js Analyzer](https://via.placeholder.com/800x400?text=Next.js+Analyzer)

## Features

- **Component Analysis**: Detection and analysis of server and client components
- **Performance Analysis**: Bundle size and image optimization checks
- **Security Analysis**: Security checks in server components and API routes
- **SEO Analysis**: Meta tag and semantic HTML checks
- **Data Fetching Analysis**: Analysis of getServerSideProps, getStaticProps, and client-side data fetching methods
- **Code Quality Analysis**: Detection of unused components
- **Route Analysis**: Detection and mapping of static and dynamic routes
- **Historical Analysis**: Version comparison and trend analysis
- **Advanced Visualization**: Interactive graphs and filtering features

## Installation

```bash
npm install -g nextjs-analyzer
```

or

```bash
yarn global add nextjs-analyzer
```

## Usage

### Basic Usage

```bash
# Run in the project directory
nextjs-analyzer analyze

# Analyze a specific Next.js project
nextjs-analyzer analyze --path /path/to/your/nextjs/project
```

### Analysis with a Specific Module

```bash
# Component analysis only
nextjs-analyzer analyze --module component --path /path/to/your/nextjs/project

# Performance analysis only
nextjs-analyzer analyze --module performance --path /path/to/your/nextjs/project

# Security analysis only
nextjs-analyzer analyze --module security --path /path/to/your/nextjs/project

# SEO analysis only
nextjs-analyzer analyze --module seo --path /path/to/your/nextjs/project

# Data fetching analysis only
nextjs-analyzer analyze --module data-fetching --path /path/to/your/nextjs/project

# Code quality analysis only
nextjs-analyzer analyze --module code-quality --path /path/to/your/nextjs/project

# Route analysis only
nextjs-analyzer analyze --module routing --path /path/to/your/nextjs/project

# Historical analysis only
nextjs-analyzer analyze --module history --path /path/to/your/nextjs/project

# Advanced visualization
nextjs-analyzer analyze --module visualization --path /path/to/your/nextjs/project
```

### Shortcut Commands

```bash
# Component analysis
nextjs-analyzer analyze:component --path /path/to/your/nextjs/project

# Performance analysis
nextjs-analyzer analyze:performance --path /path/to/your/nextjs/project

# Security analysis
nextjs-analyzer analyze:security --path /path/to/your/nextjs/project

# SEO analysis
nextjs-analyzer analyze:seo --path /path/to/your/nextjs/project

# Data fetching analysis
nextjs-analyzer analyze:data-fetching --path /path/to/your/nextjs/project

# Code quality analysis
nextjs-analyzer analyze:code-quality --path /path/to/your/nextjs/project

# Route analysis
nextjs-analyzer analyze:routing --path /path/to/your/nextjs/project

# Historical analysis
nextjs-analyzer analyze:history --path /path/to/your/nextjs/project

# Visualization
nextjs-analyzer visualize --path /path/to/your/nextjs/project
```

### Listing Available Modules

```bash
nextjs-analyzer list-modules
```

## Language Settings

Next.js Analyzer supports multiple languages. You can change the language using the `settings` command:

```bash
# Change language settings
nextjs-analyzer settings
```

This will open an interactive menu where you can select your preferred language. Currently supported languages:

- English (default)
- Turkish (Türkçe)

## Output Formats

Next.js Analyzer presents analysis results in three different formats:

- **Text**: In readable text format on the terminal
- **HTML**: In HTML format with interactive graphs and filtering features
- **JSON**: In JSON format for programmatic use

```bash
# Output in HTML format
nextjs-analyzer analyze --path /path/to/your/nextjs/project --format html

# Output in JSON format
nextjs-analyzer analyze --path /path/to/your/nextjs/project --format json

# Output in text format (default)
nextjs-analyzer analyze --path /path/to/your/nextjs/project --format text
```

## Module Details

### Component Analysis

Detection and analysis of server and client components. Supports Next.js 13+ App Router and Pages Router.

```bash
nextjs-analyzer analyze:component --path /path/to/your/nextjs/project
```

### Performance Analysis

Bundle size and image optimization checks. Detects large components and unoptimized images.

```bash
nextjs-analyzer analyze:performance --path /path/to/your/nextjs/project
```

### Security Analysis

Security checks in server components and API routes. Detects potential security vulnerabilities.

```bash
nextjs-analyzer analyze:security --path /path/to/your/nextjs/project
```

### SEO Analysis

Meta tag and semantic HTML checks. Detects important deficiencies for SEO.

```bash
nextjs-analyzer analyze:seo --path /path/to/your/nextjs/project
```

### Data Fetching Analysis

Analysis of getServerSideProps, getStaticProps, and client-side data fetching methods. Provides cache strategy recommendations.

```bash
nextjs-analyzer analyze:data-fetching --path /path/to/your/nextjs/project
```

### Code Quality Analysis

Detection of unused components. Provides recommendations to improve code quality.

```bash
nextjs-analyzer analyze:code-quality --path /path/to/your/nextjs/project
```

### Route Analysis

Detection and mapping of static and dynamic routes. Visualizes the route structure.

```bash
nextjs-analyzer analyze:routing --path /path/to/your/nextjs/project
```

### Historical Analysis

Version comparison and trend analysis. Analyzes the project's changes over time.

```bash
nextjs-analyzer analyze:history --path /path/to/your/nextjs/project
```

### Advanced Visualization

Interactive graphs and filtering features. Visualizes analysis results.

```bash
nextjs-analyzer visualize --path /path/to/your/nextjs/project
```

## Programmatic Usage

You can use Next.js Analyzer programmatically in your own project:

```javascript
const { NextJsAnalyzer } = require('nextjs-analyzer');

async function analyzeProject() {
  const analyzer = new NextJsAnalyzer({
    projectPath: '/path/to/your/nextjs/project',
    modules: ['component', 'performance', 'security']
  });
  
  const results = await analyzer.analyze();
  console.log(results);
}

analyzeProject();
```

## Contributing

To contribute, please open an issue or submit a pull request on GitHub.

## License

MIT
