const { expect } = require('@playwright/test');

class PlaywrightAutoHeal {
    constructor(page) {
        this.page = page;
        this.healingStrategies = new Map();
        this.successRates = new Map();
        this.timeout = 5000; // Default timeout in ms
    }

    /**
     * Add a locator with healing strategies
     * @param {string} name - Identifier for the element
     * @param {Object} strategies - Object containing different locator strategies
     */
    addElement(name, strategies) {
        this.healingStrategies.set(name, {
            primary: strategies.primary,
            alternatives: strategies.alternatives || [],
            currentStrategy: 0
        });
        
        this.successRates.set(name, new Array(strategies.alternatives.length + 1).fill({
            attempts: 0,
            successes: 0
        }));
    }

    /**
     * Create a Playwright locator based on strategy
     * @param {Object} strategy - Locator strategy
     * @returns {Locator} - Playwright locator
     */
    _createLocator(strategy) {
        const { type, value } = strategy;
        
        switch (type) {
            case 'css':
                return this.page.locator(value);
            case 'xpath':
                return this.page.locator(`xpath=${value}`);
            case 'text':
                return this.page.getByText(value, { exact: true });
            case 'role':
                return this.page.getByRole(value.role, { name: value.name });
            case 'testid':
                return this.page.getByTestId(value);
            case 'label':
                return this.page.getByLabel(value);
            case 'placeholder':
                return this.page.getByPlaceholder(value);
            default:
                throw new Error(`Unsupported locator type: ${type}`);
        }
    }

    /**
     * Find element using auto-healing strategy
     * @param {string} name - Element identifier
     * @returns {Promise<Locator>} - Playwright locator
     */
    async findElement(name) {
        const element = this.healingStrategies.get(name);
        if (!element) {
            throw new Error(`No healing strategies found for element: ${name}`);
        }

        try {
            // Try primary strategy first
            const locator = this._createLocator(element.primary);
            await locator.waitFor({ timeout: this.timeout });
            this._updateSuccessRate(name, 0, true);
            return locator;
        } catch (error) {
            console.warn(`Primary locator failed for ${name}, trying alternatives...`);
            
            // Try alternative strategies
            for (let i = 0; i < element.alternatives.length; i++) {
                try {
                    const locator = this._createLocator(element.alternatives[i]);
                    await locator.waitFor({ timeout: this.timeout });
                    this._updateSuccessRate(name, i + 1, true);
                    
                    // If alternative succeeds, consider promoting it
                    this._promoteSuccessfulStrategy(name, i);
                    
                    return locator;
                } catch (e) {
                    this._updateSuccessRate(name, i + 1, false);
                    continue;
                }
            }
            
            throw new Error(`All locator strategies failed for element: ${name}`);
        }
    }

    /**
     * Wrapper for common Playwright actions with auto-healing
     * @param {string} name - Element identifier
     */
    async actions(name) {
        const locator = await this.findElement(name);
        
        return {
            click: async () => await locator.click(),
            fill: async (value) => await locator.fill(value),
            type: async (value) => await locator.type(value),
            press: async (key) => await locator.press(key),
            isVisible: async () => await locator.isVisible(),
            textContent: async () => await locator.textContent(),
            getAttribute: async (attr) => await locator.getAttribute(attr),
            hover: async () => await locator.hover(),
            dragTo: async (target) => await locator.dragTo(target),
            screenshot: async (options) => await locator.screenshot(options),
            count: async () => await locator.count(),
            first: () => locator.first(),
            last: () => locator.last(),
            nth: (index) => locator.nth(index),
            locator: () => locator // Return raw locator if needed
        };
    }

    /**
     * Update success rate for a strategy
     * @param {string} name - Element identifier
     * @param {number} strategyIndex - Index of the strategy
     * @param {boolean} success - Whether the attempt was successful
     */
    _updateSuccessRate(name, strategyIndex, success) {
        const rates = this.successRates.get(name);
        const currentRate = { ...rates[strategyIndex] };
        currentRate.attempts++;
        if (success) {
            currentRate.successes++;
        }
        rates[strategyIndex] = currentRate;
    }

    /**
     * Promote successful alternative strategy to primary if it performs better
     * @param {string} name - Element identifier
     * @param {number} successfulIndex - Index of successful alternative
     */
    _promoteSuccessfulStrategy(name, successfulIndex) {
        const element = this.healingStrategies.get(name);
        const successfulStrategy = element.alternatives[successfulIndex];
        
        const primaryRate = this._getSuccessRate(name, 0);
        const alternativeRate = this._getSuccessRate(name, successfulIndex + 1);
        
        if (alternativeRate > primaryRate * 1.2) { // 20% better
            element.alternatives[successfulIndex] = element.primary;
            element.primary = successfulStrategy;
            this.healingStrategies.set(name, element);
        }
    }

    /**
     * Calculate success rate for a strategy
     * @param {string} name - Element identifier
     * @param {number} strategyIndex - Index of the strategy
     * @returns {number} Success rate
     */
    _getSuccessRate(name, strategyIndex) {
        const rates = this.successRates.get(name);
        const { attempts, successes } = rates[strategyIndex];
        return attempts === 0 ? 0 : successes / attempts;
    }

    /**
     * Set global timeout for element location attempts
     * @param {number} ms - Timeout in milliseconds
     */
    setTimeout(ms) {
        this.timeout = ms;
    }

    /**
     * Get analytics for element locator strategies
     * @param {string} name - Element identifier
     * @returns {Object} Analytics data
     */
    getAnalytics(name) {
        return {
            successRates: this.successRates.get(name),
            currentStrategies: this.healingStrategies.get(name)
        };
    }
}

// Example usage in a Playwright test:
/*
const test = async ({ page }) => {
    const autoHealer = new PlaywrightAutoHeal(page);
    
    // Add element with multiple locator strategies
    autoHealer.addElement('loginButton', {
        primary: { type: 'testid', value: 'login-button' },
        alternatives: [
            { type: 'role', value: { role: 'button', name: 'Login' } },
            { type: 'text', value: 'Login' },
            { type: 'css', value: '.login-btn' },
            { type: 'xpath', value: "//button[contains(text(), 'Login')]" }
        ]
    });

    // Use the auto-healing locator with built-in actions
    const loginButton = await autoHealer.actions('loginButton');
    await loginButton.click();
    
    // Add a form input with multiple strategies
    autoHealer.addElement('username', {
        primary: { type: 'testid', value: 'username-input' },
        alternatives: [
            { type: 'label', value: 'Username' },
            { type: 'placeholder', value: 'Enter username' },
            { type: 'css', value: '#username' }
        ]
    });

    // Fill the form using auto-healing locator
    const usernameInput = await autoHealer.actions('username');
    await usernameInput.fill('testuser');
};
*/
