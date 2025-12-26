import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FaGithub,
  FaStar,
  FaCode,
  FaDocker,
  FaExternalLinkAlt,
  FaBook,
} from "react-icons/fa";
import { SiNpm } from "react-icons/si";
import { VscCode } from "react-icons/vsc";
import "./Components.css";

interface Component {
  title: string;
  description: string;
  icon: string;
  tech: string[];
  github: string;
  projectUrl?: string;
  docUrl?: string;
  vsCode?: string;
  npm?: string;
  docker?: string;
  stats?: {
    tests?: string;
    coverage?: string;
    tools?: string;
  };
  highlights: string[];
  category: "Production" | "Active";
}

const components: Component[] = [
  {
    title: "MCP ACS Debugger",
    icon: "🐛",
    description:
      "The most comprehensive debugging interface for AI agents with 25+ professional tools, performance profiling, and hang detection.",
    tech: ["TypeScript", "Chrome DevTools Protocol", "VS Code DAP", "Jest"],
    github: "https://github.com/Digital-Defiance/mcp-debugger-server",
    vsCode:
      "https://marketplace.visualstudio.com/items?itemName=digitaldefiance.ts-mcp-debugger",
    npm: "https://www.npmjs.com/package/@ai-capabilities-suite/mcp-debugger-server",
    docker: "https://hub.docker.com/r/digitaldefiance/mcp-debugger-server",
    category: "Production",
    stats: {
      tests: "1,059 tests",
      coverage: "94.5%",
      tools: "25+ tools",
    },
    highlights: [
      "Advanced breakpoints (logpoints, conditional, function, hit count)",
      "CPU & memory profiling with flame graphs",
      "Infinite loop & hang detection",
      "Multi-language support via VS Code DAP",
      "Enterprise security with authentication & rate limiting",
    ],
  },
  {
    title: "MCP ACS Screenshot",
    icon: "📸",
    description:
      "Transform AI agents into visual UI experts with screenshot capture, PII masking, and cross-platform support.",
    tech: ["TypeScript", "Tesseract OCR", "X11", "Wayland", "Windows API"],
    github: "https://github.com/Digital-Defiance/mcp-screenshot",
    vsCode:
      "https://marketplace.visualstudio.com/items?itemName=DigitalDefiance.mcp-screenshot",
    npm: "https://www.npmjs.com/package/@ai-capabilities-suite/mcp-screenshot",
    docker: "https://hub.docker.com/r/digitaldefiance/mcp-screenshot",
    category: "Production",
    stats: {
      tests: "267 tests",
    },
    highlights: [
      "Full screen, window, and region capture",
      "PII masking with OCR detection",
      "Multiple format support (PNG, JPEG, WebP, BMP)",
      "Cross-platform (Linux, macOS, Windows)",
      "Docker support with headless capture",
    ],
  },
  {
    title: "MCP ACS Process",
    icon: "⚙️",
    description:
      "Enterprise-grade process management with strict security boundaries, resource monitoring, and service management.",
    tech: ["TypeScript", "Node.js", "Resource Monitoring", "Security"],
    github: "https://github.com/Digital-Defiance/mcp-process",
    vsCode:
      "https://marketplace.visualstudio.com/items?itemName=DigitalDefiance.mcp-acs-process",
    npm: "https://www.npmjs.com/package/@ai-capabilities-suite/mcp-process",
    docker: "https://hub.docker.com/r/digitaldefiance/mcp-process",
    category: "Production",
    stats: {
      tools: "12 tools",
    },
    highlights: [
      "6 layers of security validation",
      "Process launching with resource limits",
      "Real-time CPU, memory, and I/O monitoring",
      "Service management with auto-restart",
      "Process groups and pipelines",
    ],
  },
  {
    title: "MCP ACS Filesystem",
    icon: "💾",
    description:
      "Advanced file operations with atomic transactions, directory watching, content indexing, and integrity verification.",
    tech: ["TypeScript", "Node.js", "File System", "Checksum"],
    github: "https://github.com/Digital-Defiance/mcp-filesystem",
    vsCode:
      "https://marketplace.visualstudio.com/items?itemName=DigitalDefiance.mcp-acs-filesystem",
    npm: "https://www.npmjs.com/package/@ai-capabilities-suite/mcp-filesystem",
    docker: "https://hub.docker.com/r/digitaldefiance/mcp-filesystem",
    category: "Production",
    highlights: [
      "Atomic batch operations with rollback",
      "Real-time directory watching",
      "Content search and indexing",
      "Checksum verification (MD5, SHA-256, SHA-512)",
      "Disk usage analysis",
    ],
  },
  {
    title: "MCP ACS Testing",
    icon: "🧪",
    description:
      "Enterprise-grade testing capabilities for AI agents with 25+ tools covering test execution, coverage analysis, debugging, and more.",
    tech: ["TypeScript", "Jest", "Mocha", "Pytest", "Vitest"],
    github: "https://github.com/Digital-Defiance/mcp-testing",
    vsCode:
      "https://marketplace.visualstudio.com/items?itemName=DigitalDefiance.mcp-acs-testing",
    npm: "https://www.npmjs.com/package/@ai-capabilities-suite/mcp-testing",
    docker: "https://hub.docker.com/r/digitaldefiance/mcp-testing",
    category: "Production",
    stats: {
      tools: "25+ tools",
    },
    highlights: [
      "Multi-framework test execution",
      "Code coverage analysis with detailed metrics",
      "Mutation testing for test suite validation",
      "Flaky test detection and analysis",
      "Visual regression testing integration",
    ],
  },
  {
    title: "Akira",
    icon: "🎯",
    description:
      "Spec-driven development for GitHub Copilot using EARS requirements syntax with MCP integration and property-based testing.",
    tech: ["TypeScript", "VS Code API", "MCP", "EARS", "fast-check"],
    github: "https://github.com/Digital-Defiance/akira",
    projectUrl: "https://digital-defiance.github.io/Akira/",
    category: "Active",
    highlights: [
      "EARS-compliant requirements engineering",
      "INCOSE quality validation",
      "Property-based testing integration",
      "Requirements → Design → Tasks → Execution workflow",
      "MCP-powered persistent context",
    ],
  },
];

const Components = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="components section" id="components" ref={ref}>
      <motion.div
        className="components-container"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section-title">
          The <span className="gradient-text">Complete</span> Solution
        </h2>
        <p className="components-subtitle">
          Professional-grade MCP servers and tools that give AI agents
          superpowers they've never had before
        </p>

        <motion.div
          className="suite-intro"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3>
            What if AI agents could actually <em>see</em>, <em>debug</em>, and{" "}
            <em>control</em> your development environment?
          </h3>
          <p>
            <strong>
              We've built the most comprehensive suite of MCP servers that give
              AI agents superpowers they've never had before.
            </strong>{" "}
            This isn't just another tool collection—it's a paradigm shift that
            transforms AI assistants from code generators into intelligent
            development partners with <strong>runtime visibility</strong>,{" "}
            <strong>system control</strong>, and{" "}
            <strong>physical world access</strong>.
          </p>
          <div className="problem-solution">
            <div className="problem">
              <h4>❌ The Problem: AI Agents Today Are Powerful But Blind</h4>
              <ul>
                <li>Can't see what code actually does when it runs</li>
                <li>Can't capture your screen or record demonstrations</li>
                <li>Can't manage files beyond basic read/write</li>
                <li>Can't control processes or applications</li>
                <li>Can't interact with your actual development environment</li>
              </ul>
              <p>
                <strong>Result:</strong> You're stuck doing manual work that AI
                should handle.
              </p>
            </div>
            <div className="solution">
              <h4>✅ The Solution: Complete Enterprise-Grade Capabilities</h4>
              <p>
                The <strong>AI Capabilities Suite</strong> provides{" "}
                <strong>5 comprehensive MCP servers</strong> (Debugger,
                Screenshot, Process, Filesystem, Testing) that give AI agents
                professional-grade capabilities—plus <strong>Akira</strong>, a
                spec-driven development tool that leverages MCP for persistent
                context and requirements engineering. Together, they form a
                complete ecosystem designed to work seamlessly.
              </p>
              <p>
                Built with TypeScript and exhaustively tested (
                <strong>over 1,300 tests with 94%+ coverage</strong>), these
                tools are production-ready and available across multiple
                platforms: <strong>NPM packages</strong>,{" "}
                <strong>VS Code extensions</strong>,{" "}
                <strong>Docker containers</strong>, and{" "}
                <strong>standalone binaries</strong>.
              </p>
            </div>
          </div>
          <div className="value-props">
            <div className="value-prop">
              <strong>🚀 Zero Configuration</strong>
              <p>
                Install from VS Code Marketplace and start immediately—no setup
                required
              </p>
            </div>
            <div className="value-prop">
              <strong>🤖 GitHub Copilot Ready</strong>
              <p>
                Native integration with AI assistants for intelligent debugging
                workflows
              </p>
            </div>
            <div className="value-prop">
              <strong>🏢 Enterprise Quality</strong>
              <p>
                Production-tested with comprehensive security, error handling,
                and monitoring
              </p>
            </div>
            <div className="value-prop">
              <strong>🌐 Multi-Platform</strong>
              <p>
                Available as VS Code extensions, NPM packages, Docker images,
                and binaries
              </p>
            </div>
          </div>
        </motion.div>

        <div className="components-grid">
          {components.map((component, index) => (
            <motion.div
              key={component.title}
              className="component-card card"
              initial={{ opacity: 0, y: 50 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <div className="component-header">
                <div className="component-icon">{component.icon}</div>
                <h3>{component.title}</h3>
                <span
                  className={`component-badge ${component.category.toLowerCase()}`}
                >
                  {component.category}
                </span>
              </div>

              <p className="component-description">{component.description}</p>

              {component.stats && (
                <div className="component-stats">
                  {component.stats.tests && (
                    <div className="stat">
                      <FaCode />
                      <span>{component.stats.tests}</span>
                    </div>
                  )}
                  {component.stats.coverage && (
                    <div className="stat">
                      <FaStar />
                      <span>{component.stats.coverage} coverage</span>
                    </div>
                  )}
                  {component.stats.tools && (
                    <div className="stat">
                      <FaCode />
                      <span>{component.stats.tools}</span>
                    </div>
                  )}
                </div>
              )}

              <ul className="component-highlights">
                {component.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>

              <div className="component-tech">
                {component.tech.map((tech) => (
                  <span key={tech} className="tech-badge">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="component-links">
                <a
                  href={component.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="component-link"
                >
                  <FaGithub />
                  GitHub
                </a>
                {component.projectUrl && (
                  <a
                    href={component.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="component-link"
                  >
                    <FaExternalLinkAlt />
                    Project Site
                  </a>
                )}
                {component.docUrl && (
                  <a
                    href={component.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="component-link"
                  >
                    <FaBook />
                    Documentation
                  </a>
                )}
                {component.vsCode && (
                  <a
                    href={component.vsCode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="component-link"
                  >
                    <VscCode />
                    VS Code
                  </a>
                )}
                {component.npm && (
                  <a
                    href={component.npm}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="component-link"
                  >
                    <SiNpm />
                    NPM
                  </a>
                )}
                {component.docker && (
                  <a
                    href={component.docker}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="component-link"
                  >
                    <FaDocker />
                    Docker
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Components;
