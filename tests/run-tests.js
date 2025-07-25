#!/usr/bin/env node

/**
 * Test Runner for Memory Graph Explorer
 * Runs all test suites in the correct order
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
    constructor() {
        this.testsDir = path.join(__dirname);
        this.results = {
            apiEndpoints: null,
            mcpHttp: null,
            ui: null
        };
    }

    async checkDocker() {
        console.log('🐳 Checking Docker services...');
        try {
            execSync('curl -s http://localhost:8080/api/health', { stdio: 'pipe' });
            console.log('✅ Web interface is running');
        } catch {
            console.log('❌ Web interface not accessible - is `docker-compose up` running?');
            return false;
        }

        try {
            execSync('curl -s http://localhost:3001/mcp', { stdio: 'pipe' });
            console.log('✅ MCP server is running');
        } catch {
            console.log('❌ MCP server not accessible - is `docker-compose up` running?');
            return false;
        }

        return true;
    }

    async runTest(testFile, testName) {
        return new Promise((resolve) => {
            console.log(`\n🧪 Running ${testName}...`);
            console.log('─'.repeat(50));
            
            const testProcess = spawn('node', [path.join(this.testsDir, testFile)], {
                stdio: 'inherit',
                shell: process.platform === 'win32'
            });

            testProcess.on('close', (code) => {
                const success = code === 0;
                console.log('─'.repeat(50));
                console.log(`${success ? '✅' : '❌'} ${testName} ${success ? 'PASSED' : 'FAILED'}`);
                resolve(success);
            });

            testProcess.on('error', (error) => {
                console.log('─'.repeat(50));
                console.log(`❌ ${testName} ERROR: ${error.message}`);
                resolve(false);
            });
        });
    }

    async runAllTests() {
        console.log('🚀 Memory Graph Explorer Test Suite');
        console.log('═'.repeat(50));

        // Check prerequisites
        const dockerReady = await this.checkDocker();
        if (!dockerReady) {
            console.log('\n💡 Please run `docker-compose up` first, then retry tests.');
            process.exit(1);
        }

        // Run core tests
        this.results.apiEndpoints = await this.runTest('test-api-endpoints.js', 'API Endpoints');
        this.results.mcpHttp = await this.runTest('test-mcp-http.js', 'MCP StreamableHTTP');

        // Check if Playwright is available for UI tests
        const uiTestExists = fs.existsSync(path.join(this.testsDir, 'test-screenshot.spec.js'));
        if (uiTestExists) {
            console.log('\n📝 UI tests available but require Playwright setup.');
            console.log('   Run manually: npx playwright test tests/test-screenshot.spec.js');
        }

        // Print final summary
        console.log('\n📊 Final Test Results:');
        console.log('═'.repeat(50));
        
        const allTests = [
            ['API Endpoints', this.results.apiEndpoints],
            ['MCP StreamableHTTP', this.results.mcpHttp]
        ];

        let passed = 0;
        let total = allTests.length;

        allTests.forEach(([name, result]) => {
            console.log(`${result ? '✅' : '❌'} ${name}`);
            if (result) passed++;
        });

        console.log('─'.repeat(50));
        console.log(`📈 Overall: ${passed}/${total} test suites passed`);
        
        if (passed === total) {
            console.log('🎉 All core tests passed! System is ready.');
            process.exit(0);
        } else {
            console.log('⚠️  Some tests failed. Check the output above.');
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const runner = new TestRunner();
    runner.runAllTests().catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = TestRunner;
