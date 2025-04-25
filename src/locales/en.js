/**
 * English language file
 */
module.exports = {
  common: {
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info"
  },
  cli: {
    name: "nextjs-analyzer",
    description: "A modular tool for analyzing Next.js projects",
    commands: {
      analyze: {
        description: "Run all analysis modules",
        options: {
          path: "Path to the Next.js project to analyze",
          output: "Path to save analysis results",
          format: "Output format (text, json, or html)",
          verbose: "Show detailed output"
        },
        messages: {
          moduleSelection: "Which module would you like to run?",
          formatSelection: "Which output format would you like?",
          allModules: "All modules: Run all analysis modules",
          runningModules: "Running modules...",
          visualizing: "Visualizing results...",
          completed: "Analysis completed."
        }
      },
      listModules: {
        description: "List available analysis modules",
        messages: {
          availableModules: "Available Analysis Modules:"
        }
      },
      settings: {
        description: "Configure application settings",
        messages: {
          languageSelection: "Which language would you like to use?",
          languageChanged: "Language changed to: {language}",
          settingsSaved: "Settings saved."
        }
      }
    },
    formats: {
      text: "Text",
      html: "HTML",
      json: "JSON"
    }
  },
  analyzer: {
    messages: {
      analyzing: "Analyzing Next.js project...",
      noNextJsDirs: "Error: Next.js app or pages directory not found.",
      noJsFiles: "Error: No JavaScript/TypeScript files found.",
      filesFound: "{count} files found.",
      analysisFailed: "Analysis failed.",
      unexpectedError: "An unexpected error occurred:"
    }
  },
  modules: {
    component: {
      name: "component",
      description: "Analyzes server and client components in Next.js projects",
      types: {
        server: "Server Component",
        client: "Client Component"
      }
    },
    performance: {
      name: "performance",
      description: "Provides performance metrics and optimization suggestions",
      imageOptimization: {
        title: "Image Optimization",
        fullyOptimized: "All images are optimized. Great!",
        notFullyOptimized: "Out of {totalImages} images, {nonOptimizedCount} are not optimized.",
        nonOptimizedImages: "Non-Optimized Images",
        issues: {
          noNextImage: "Next.js Image component is not used",
          noWidthHeight: "Width and/or height not specified in Image component",
          noPriority: "Priority attribute not used for hero/banner image"
        },
        recommendations: {
          useNextImage: "Import next/image and use the <Image> component",
          addWidthHeight: "Specify width and height to prevent CLS (Cumulative Layout Shift) issues",
          addPriority: "Add priority to hero images to improve LCP (Largest Contentful Paint) metric"
        }
      },
      bundleSize: {
        title: "Bundle Size Analysis",
        largeComponents: {
          title: "Large Components",
          noLargeComponents: "No large components detected. Great!",
          recommendation: "Consider breaking the component into smaller pieces"
        },
        largeImports: {
          title: "Large Libraries",
          noLargeImports: "No large library imports detected. Great!",
          recommendations: {
            lodash: "Import only the functions you need: import { debounce } from \"lodash/debounce\"",
            moment: "Use lighter alternatives like date-fns or day.js",
            chartjs: "Import only the chart types you need",
            threejs: "Use dynamic import for lazy loading",
            monaco: "Use dynamic import for lazy loading",
            draftjs: "Use dynamic import for lazy loading",
            quill: "Use dynamic import for lazy loading",
            reactBootstrap: "Import only the components you need",
            materialUi: "Use the tree-shakeable version of @mui/material",
            materialCore: "Import only the components you need",
            mui: "Import only the components you need",
            default: "Use dynamic import for lazy loading"
          }
        }
      },
      visualize: {
        title: "Performance Analysis",
        file: "File",
        issue: "Issue",
        recommendation: "Recommendation",
        size: "Size",
        library: "Library",
        source: "Source"
      }
    },
    security: {
      name: "security",
      description: "Detects security vulnerabilities and risks",
      serverComponent: {
        title: "Server Component Security",
        noIssues: "No security issues detected in server components. Great!",
        issues: {
          sensitiveEnvVars: "Sensitive environment variables used directly in server component",
          sqlInjection: "Potential SQL injection risk",
          fileSystemAccess: "File system access with user input",
          evalUsage: "Usage of eval() or new Function()"
        },
        recommendations: {
          title: "Server Component Security",
          description: "Server components may contain sensitive information. Be careful not to leak this information to the client.",
          envVars: {
            title: "Environment Variables",
            description: "Environment variables used in server components are not included in the client bundle. However, using these variables directly in JSX can cause this information to leak to the client."
          },
          dataValidation: {
            title: "Data Validation",
            description: "Always validate and sanitize user inputs in server components."
          },
          sensitiveEnvVars: "Avoid sending sensitive environment variables directly to the client. Instead, use API routes to process this information securely.",
          sqlInjection: "Use parameterized queries or an ORM instead of directly using user inputs in SQL queries.",
          fileSystemAccess: "Using user inputs in file paths is dangerous. Validate and sanitize inputs.",
          evalUsage: "Avoid using eval() and new Function() as they are vulnerable to code injection attacks."
        }
      },
      apiRoute: {
        title: "API Route Security",
        noIssues: "No security issues detected in API routes. Great!",
        issues: {
          corsConfig: "Missing CORS configuration",
          corsWildcard: "CORS configuration too broad (wildcard *)",
          rateLimiting: "Missing rate limiting",
          authentication: "Missing authentication check in data-modifying API endpoint",
          inputValidation: "Missing input validation",
          httpMethod: "Missing HTTP method check"
        },
        recommendations: {
          title: "API Route Security",
          description: "API routes are the gateways of your application to the outside world. Therefore, you should carefully implement security measures.",
          cors: {
            title: "CORS Configuration",
            description: "CORS configuration controls which domains can access your API. Instead of using wildcard (*), allow specific domains."
          },
          rateLimiting: {
            title: "Rate Limiting",
            description: "Rate limiting restricts requests to your API and provides protection against DDoS attacks."
          },
          auth: {
            title: "Authentication and Authorization",
            description: "Always perform authentication and authorization checks in data-modifying API endpoints."
          },
          inputValidation: {
            title: "Input Validation",
            description: "Always validate and sanitize user inputs. This provides protection against injection attacks."
          },
          corsConfig: "Add CORS configuration to API routes. Use next-cors or manually add Access-Control-Allow-Origin header.",
          corsWildcard: "Instead of wildcard (*), allow specific domains.",
          rateLimiting: "Add rate limiting to API routes. You can use express-rate-limit or a similar library.",
          authentication: "Add authentication check to data-modifying API endpoints.",
          inputValidation: "Add input validation to API routes. You can use libraries like Joi, Yup, Zod.",
          httpMethod: "Add HTTP method check to API routes. For example: if (req.method !== \"POST\") { return res.status(405).end(); }"
        }
      },
      general: {
        title: "General Security",
        noIssues: "No general security issues detected. Great!",
        issues: {
          oldNextVersion: "Using old Next.js version ({version})",
          insecurePackage: "Package with security vulnerability: {package}@{version}",
          envNotIgnored: "{file} file not in .gitignore",
          sensitiveEnvVar: "Environment variable containing sensitive information: {key}",
          cspMissing: "Missing Content Security Policy (CSP)",
          unsafeConfig: "Unsafe configuration: dangerouslyAllowSVG or dangerouslyAllowHTML"
        },
        recommendations: {
          title: "General Security",
          dependencies: {
            title: "Dependency Security",
            description: "Regularly update your dependencies and check for security vulnerabilities. You can use npm audit or yarn audit commands."
          },
          envSecurity: {
            title: "Environment Variable Security",
            description: "Always add .env files to .gitignore and manage sensitive information securely."
          },
          csp: {
            title: "Content Security Policy",
            description: "Content Security Policy (CSP) provides strong protection against XSS attacks. Configure CSP headers in your next.config.js file."
          },
          safeConfig: {
            title: "Safe Configuration",
            description: "Avoid unsafe configurations like dangerouslyAllowSVG, dangerouslyAllowHTML."
          },
          securityAudits: {
            title: "Regular Security Audits",
            description: "Regularly audit your application for security vulnerabilities and keep it up to date."
          },
          oldNextVersion: "Upgrade Next.js to the latest version for security updates.",
          insecurePackage: "Upgrade {package} package to at least version {minVersion}.",
          envNotIgnored: "Add {file} file to .gitignore. Sensitive information should not be stored in the repository.",
          sensitiveEnvVar: "Add {file} file to .gitignore and manage sensitive information securely.",
          cspMissing: "Add Content Security Policy to next.config.js file. This provides protection against XSS attacks.",
          unsafeConfig: "These configurations may be vulnerable to XSS attacks. Avoid using them if possible."
        }
      },
      visualize: {
        title: "Security Analysis",
        summary: "Summary",
        totalIssues: "Total {count} security issues detected:",
        criticalIssues: "Critical",
        highIssues: "High",
        mediumIssues: "Medium",
        lowIssues: "Low",
        detectedIssues: "Detected Issues",
        recommendations: "Recommendations",
        file: "File",
        issue: "Issue",
        severity: "Severity",
        recommendation: "Recommendation"
      }
    },
    seo: {
      name: "seo",
      description: "Analyzes SEO compatibility and meta tags",
      metaTags: {
        title: "Meta Tag Issues",
        noIssues: "No meta tag issues detected. Great!",
        issues: {
          titleMissing: "Missing title tag",
          descriptionMissing: "Missing meta description",
          ogMissing: "Missing Open Graph meta tags",
          twitterMissing: "Missing Twitter Card meta tags",
          canonicalMissing: "Missing canonical URL",
          robotsBlocking: "Robots meta tag blocking page indexing",
          viewportMissing: "Missing viewport meta tag",
          langMissing: "Missing HTML lang attribute"
        },
        recommendations: {
          title: "Meta Tag Recommendations",
          titleTag: "Add title tag to the page. This is very important for SEO.",
          descriptionTag: "Add meta description to the page. This is the description displayed in search results.",
          ogTags: "Add Open Graph meta tags for social media sharing.",
          twitterTags: "Add Twitter Card meta tags for Twitter sharing.",
          canonicalUrl: "Add canonical URL to prevent duplicate content issues.",
          robotsTags: "If this page should be indexed, remove noindex and nofollow values.",
          viewportTag: "Add viewport meta tag for mobile compatibility.",
          langAttribute: "Add HTML lang attribute for accessibility and SEO.",
          nextSeo: {
            title: "Using next-seo",
            description: "The next-seo package simplifies SEO management in Next.js projects. Using this package, you can manage all meta tags centrally."
          },
          dynamicMetaTags: {
            title: "Dynamic Meta Tags",
            description: "For pages with dynamic content, create dynamic meta tags based on page content. This helps search engines better understand your page."
          },
          structuredData: {
            title: "Structured Data",
            description: "Add structured data in JSON-LD format. This enables rich snippets to be displayed in search results."
          },
          hreflang: {
            title: "Hreflang Tags",
            description: "Add hreflang tags for multilingual sites. This helps search engines show the correct language version of the page."
          }
        }
      },
      semanticHtml: {
        title: "Semantic HTML Issues",
        noIssues: "No semantic HTML issues detected. Great!",
        issues: {
          multipleH1: "Multiple H1 tags used",
          h2BeforeH1: "H2 tag used before H1",
          h3BeforeH2: "H3 tag used before H2",
          noSemanticTags: "No semantic HTML tags used",
          imgWithoutAlt: "Missing alt attribute in image tags",
          genericLinkText: "Generic link texts used"
        },
        recommendations: {
          title: "Semantic HTML Recommendations",
          headingHierarchy: "Use proper heading hierarchy. H1 tag should be at the top of the page.",
          h3AfterH2: "Use proper heading hierarchy. H3 tags should come after H2 tags.",
          useSemanticTags: "Use semantic HTML5 tags (header, nav, main, article, section, aside, footer) instead of div and span.",
          addAltAttributes: "Add alt attribute to all image tags. This is important for accessibility and SEO.",
          descriptiveLinkText: "Use more descriptive link texts instead of generic ones like \"here\", \"click\", \"link\", \"read more\".",
          semanticHtml: {
            title: "Using Semantic HTML",
            description: "Semantic HTML tags better define the structure of your page and help search engines better understand your content."
          },
          headings: {
            title: "Heading Hierarchy",
            description: "Use proper heading hierarchy. Each page should have one H1 tag and other headings should be hierarchically ordered."
          },
          altAttributes: {
            title: "Alt Attribute",
            description: "Add alt attribute to all image tags. This provides a text alternative for visual content and is important for accessibility."
          },
          linkTexts: {
            title: "Descriptive Link Texts",
            description: "Link texts should clearly indicate where the link goes. Use more descriptive texts instead of generic ones like \"here\", \"click\"."
          }
        }
      },
      accessibility: {
        title: "Accessibility Issues",
        noIssues: "No accessibility issues detected. Great!",
        issues: {
          ariaAttributesMissing: "Missing ARIA attributes",
          formLabelsMissing: "Missing labels for form inputs",
          lowContrast: "Low contrast ratio",
          keyboardNavigationMissing: "Missing keyboard navigation",
          negativeTabIndex: "Using tabIndex=\"-1\""
        },
        recommendations: {
          title: "Accessibility Recommendations",
          addAriaAttributes: "Add ARIA attributes and roles for accessibility.",
          addFormLabels: "Add labels for all form inputs and connect them to inputs with the for attribute.",
          improveContrast: "Ensure sufficient contrast ratio between text and background. According to WCAG 2.1 AA standard, there should be at least 4.5:1 contrast ratio for normal text and at least 3:1 for large text.",
          addKeyboardNavigation: "Add keyboard events for onClick events. This improves accessibility for keyboard users.",
          avoidNegativeTabIndex: "Using tabIndex=\"-1\" removes the element from keyboard navigation. This can cause accessibility issues.",
          ariaAttributes: {
            title: "ARIA Attributes",
            description: "ARIA attributes improve the accessibility of your web page. These attributes help screen readers better understand your content."
          },
          formLabels: {
            title: "Form Labels",
            description: "Add labels for all form inputs. This helps users understand what the inputs are for."
          },
          contrast: {
            title: "Contrast Ratio",
            description: "Ensure sufficient contrast ratio between text and background. This is important for users with visual impairments."
          },
          keyboardNavigation: {
            title: "Keyboard Navigation",
            description: "Ensure all interactive elements are accessible via keyboard. This is important for users who cannot use a mouse."
          },
          accessibilityTests: {
            title: "Accessibility Tests",
            description: "Regularly test your application for accessibility. You can use tools like axe, Lighthouse."
          }
        }
      },
      visualize: {
        title: "SEO Analysis",
        summary: "Summary",
        totalIssues: "Total {totalIssues} SEO issues detected:",
        metaTagIssues: "Meta Tag Issues",
        semanticHtmlIssues: "Semantic HTML Issues",
        accessibilityIssues: "Accessibility Issues",
        detectedIssues: "Detected Issues",
        file: "File",
        issue: "Issue",
        recommendation: "Recommendation",
        recommendations: "Recommendations"
      }
    },
    "data-fetching": {
      name: "data-fetching",
      description: "Analyzes data fetching methods and strategies",
      recommendations: {
        serverSideProps: {
          withRevalidate: "Consider using getStaticProps instead of getServerSideProps with revalidate",
          withRequestData: "getServerSideProps is a good choice since you need request information",
          default: "If data doesn't change frequently, consider using getStaticProps + revalidate (ISR)"
        },
        staticProps: {
          noRevalidate: "If data can change, use ISR (Incremental Static Regeneration) by adding revalidate",
          lowRevalidate: "Revalidate value is too low. Consider using a higher value to prevent unnecessary regenerations",
          default: "getStaticProps + revalidate (ISR) is a good choice"
        },
        staticPaths: {
          fallbackFalse: "fallback: false returns 404 for unknown paths. If new content is added, consider using fallback: \"blocking\" or fallback: true",
          fallbackBlocking: "fallback: \"blocking\" is a good choice. It behaves like SSR for unknown paths",
          fallbackTrue: "With fallback: true, don't forget to show a loading state",
          default: "Specify fallback value for getStaticPaths"
        },
        swr: {
          noRevalidateOnFocus: "Specify options like revalidateOnFocus, revalidateOnReconnect",
          noDedupingInterval: "Add dedupingInterval to prevent unnecessary requests",
          default: "SWR is a good choice for client-side data fetching"
        },
        reactQuery: {
          noStaleTime: "Specify staleTime and cacheTime values",
          zeroStaleTime: "staleTime: 0 fetches new data on every render. Consider using a higher value to prevent unnecessary requests",
          default: "React Query is a good choice for client-side data fetching"
        },
        fetch: {
          noCache: "Add cache strategy to fetch request: { cache: \"force-cache\" } or { cache: \"no-store\" }",
          forceCache: "force-cache is a good choice for static data",
          noStore: "no-store is a good choice for dynamic data",
          default: "Choose appropriate cache strategy for fetch API"
        },
        axios: {
          default: "Consider using axios-cache-adapter to add caching mechanism for Axios"
        }
      },
      issues: {
        bothDataFetchingMethods: {
          issue: "Using both getServerSideProps and getStaticProps in the same file",
          recommendation: "Instead of using these two functions in the same file, separate them into different files"
        },
        staticPropsNoRevalidate: {
          issue: "Using getStaticProps without specifying revalidate",
          recommendation: "Add revalidate for ISR (Incremental Static Regeneration)"
        },
        fetchNoCache: {
          issue: "Using fetch API without specifying cache strategy",
          recommendation: "Add cache strategy to fetch request: { cache: \"force-cache\" } or { cache: \"no-store\" }"
        }
      },
      generalRecommendations: {
        appRouter: {
          title: "Data Fetching with App Router",
          description: "If you're using App Router, you can fetch data with React Server Components. This reduces client-side JavaScript and improves SEO."
        },
        clientSide: {
          title: "Using SWR or React Query",
          description: "Use SWR or React Query for client-side data fetching. These libraries automatically provide features like caching, revalidation, error handling."
        },
        isr: {
          title: "Incremental Static Regeneration (ISR)",
          description: "Use ISR with getStaticProps for data that doesn't change frequently. This allows static pages to be regenerated at specific intervals."
        }
      },
      visualize: {
        title: "Data Fetching Analysis",
        methods: {
          title: "Data Fetching Methods",
          serverSideProps: "getServerSideProps",
          staticProps: "getStaticProps",
          staticPaths: "getStaticPaths",
          revalidate: "Revalidate",
          fallback: "Fallback",
          notSpecified: "Not Specified",
          recommendation: "Recommendation"
        },
        clientSide: {
          title: "Client-side Data Fetching",
          swr: "SWR",
          reactQuery: "React Query",
          fetch: "Fetch API",
          axios: "Axios",
          revalidateOnFocus: "revalidateOnFocus",
          staleTime: "staleTime",
          cache: "Cache"
        },
        cacheStrategies: {
          title: "Cache Strategies",
          issues: {
            title: "Detected Issues",
            noIssues: "No issues detected. Great!",
            issue: "Issue"
          },
          recommendations: {
            title: "General Recommendations"
          }
        }
      }
    },
    "code-quality": {
      name: "code-quality",
      description: "Checks code quality and best practices",
      types: {
        "unused-component": "Unused Component"
      },
      visualize: {
        title: "Unused Components",
        noUnusedComponents: "No unused components found."
      }
    },
    routing: {
      name: "routing",
      description: "Analyzes and visualizes route structure",
      visualize: {
        title: "Route Analysis",
        noRoutes: "No routes found.",
        appRouter: "App Router",
        pagesRouter: "Pages Router",
        pages: "Pages",
        apiRoutes: "API Routes",
        staticPages: "Static Pages",
        dynamicPages: "Dynamic Pages",
        staticApiRoutes: "Static API Routes",
        dynamicApiRoutes: "Dynamic API Routes",
        parameters: "Parameters"
      }
    },
    history: {
      name: "history",
      description: "Analyzes project history and changes",
      error: {
        noGit: "Git repository not found. Git is required for historical analysis."
      },
      summary: {
        title: "Summary",
        totalCommits: "Total {totalCommits} commits examined, {analyzedCommits} commits analyzed.",
        firstCommitDate: "First commit date: {date}",
        lastCommitDate: "Last commit date: {date}"
      },
      commitHistory: {
        title: "Commit History",
        moreCommits: "... and {count} more commits"
      },
      metricChanges: {
        title: "Metric Changes",
        metrics: {
          componentCount: "Total Component Count",
          serverComponentCount: "Server Component Count",
          clientComponentCount: "Client Component Count",
          routeCount: "Total Route Count",
          apiRouteCount: "API Route Count",
          pageRouteCount: "Page Route Count",
          dynamicRouteCount: "Dynamic Route Count",
          staticRouteCount: "Static Route Count"
        },
        trend: "Trend",
        firstValue: "First value",
        lastValue: "Last value",
        totalGrowth: "Total growth",
        growthRate: "Growth rate",
        perCommit: "/ commit",
        changeDetails: "Change Details"
      },
      trends: {
        rapidGrowth: "Rapid Growth",
        steadyGrowth: "Steady Growth",
        stable: "Stable",
        steadyDecline: "Steady Decline",
        rapidDecline: "Rapid Decline",
        unknown: "Unknown"
      },
      visualize: {
        title: "Change Over Time Analysis",
        chartTitle: "{metricName} Change"
      }
    },
    visualization: {
      name: "visualization",
      description: "Visualizes analysis results with interactive charts"
    }
  }
};
