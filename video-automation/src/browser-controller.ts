import puppeteer, { Browser, Page } from 'puppeteer';
import { Action } from './types';

export class BrowserController {
  private browser?: Browser;
  private page?: Page;

  async launch(headless: boolean = false): Promise<void> {
    this.browser = await puppeteer.launch({
      headless,
      args: [
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
      ],
      defaultViewport: { width: 1920, height: 1080 },
    });

    this.page = await this.browser.newPage();
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Browser not launched');
    }

    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  }

  async executeActions(actions: Action[]): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  private async executeAction(action: Action): Promise<void> {
    switch (action.type) {
      case 'wait':
        await this.wait(action.ms!);
        break;
      case 'scroll':
        await this.scroll(action.selector || action.to, action.duration || 1000, action.smooth);
        break;
      case 'click':
        await this.click(action.selector!);
        break;
      case 'type':
        await this.type(action.selector!, action.text!);
        break;
      case 'highlight':
        await this.highlight(action.selector!, action.color!, action.duration);
        break;
      case 'screenshot':
        await this.screenshot(action.selector!);
        break;
    }
  }

  private async scroll(
    target: string | number | undefined,
    duration: number,
    smooth?: boolean
  ): Promise<void> {
    if (!this.page) return;

    if (target === 'bottom') {
      await this.page.evaluate((dur: number, isSmooth: boolean) => {
        const behavior = isSmooth ? 'smooth' : 'auto';
        window.scrollTo({ top: document.body.scrollHeight, behavior: behavior as ScrollBehavior });
      }, duration, smooth || false);
    } else if (typeof target === 'number') {
      await this.page.evaluate((y: number, dur: number, isSmooth: boolean) => {
        const behavior = isSmooth ? 'smooth' : 'auto';
        window.scrollTo({ top: y, behavior: behavior as ScrollBehavior });
      }, target, duration, smooth || false);
    } else if (typeof target === 'string') {
      await this.page.evaluate((sel: string, dur: number, isSmooth: boolean) => {
        const el = document.querySelector(sel);
        if (el) {
          const behavior = isSmooth ? 'smooth' : 'auto';
          el.scrollIntoView({ behavior: behavior as ScrollBehavior });
        }
      }, target, duration, smooth || false);
    } else {
      await this.page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    await this.wait(duration);
  }

  private async click(selector: string): Promise<void> {
    if (!this.page) return;

    await this.page.waitForSelector(selector, { timeout: 10000 });
    await this.page.click(selector);
    await this.wait(500);
  }

  private async type(selector: string, text: string): Promise<void> {
    if (!this.page) return;

    await this.page.waitForSelector(selector);
    await this.page.type(selector, text, { delay: 100 });
  }

  private async highlight(
    selector: string,
    color: string,
    duration?: number
  ): Promise<void> {
    if (!this.page) return;

    await this.page.evaluate((sel: string, col: string) => {
      const el = document.querySelector(sel);
      if (el) {
        (el as HTMLElement).style.outline = `3px solid ${col}`;
        (el as HTMLElement).style.outlineOffset = '3px';
      }
    }, selector, color);

    if (duration) {
      await this.wait(duration);
      await this.page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        if (el) {
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.outlineOffset = '';
        }
      }, selector);
    }
  }

  private async screenshot(selector: string): Promise<Buffer> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    return await element.screenshot() as Buffer;
  }

  private async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getPage(): Page | undefined {
    return this.page;
  }
}
