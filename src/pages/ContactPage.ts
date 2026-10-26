import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type ContactTopic = 'order' | 'return' | 'account' | 'other';

export class ContactPage extends BasePage {
  protected readonly path = 'contact.html';

  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly topicSelect: Locator;
  readonly orderNumberInput: Locator;
  readonly messageInput: Locator;
  readonly messageCounter: Locator;
  readonly fileInput: Locator;
  readonly fileName: Locator;
  readonly fileError: Locator;
  readonly submitButton: Locator;
  readonly successPanel: Locator;
  readonly ticketNumber: Locator;

  constructor(page: Page) {
    super(page);
    this.nameInput = page.getByLabel('Vardas', { exact: true });
    this.emailInput = page.getByLabel('El. paštas', { exact: true });
    this.topicSelect = page.getByLabel('Tema');
    this.orderNumberInput = page.getByLabel(/Užsakymo numeris/);
    this.messageInput = page.getByLabel('Žinutė', { exact: true });
    this.messageCounter = page.getByTestId('message-counter');
    this.fileInput = page.getByLabel(/Priedas/);
    this.fileName = page.getByTestId('file-name');
    this.fileError = page.getByTestId('contact-file-error');
    this.submitButton = page.getByRole('button', { name: 'Siųsti žinutę' });
    this.successPanel = page.getByTestId('contact-success');
    this.ticketNumber = page.getByTestId('ticket-number');
  }

  fieldError(field: 'name' | 'email' | 'topic' | 'order' | 'message'): Locator {
    return this.page.getByTestId(`contact-${field}-error`);
  }

  async fillForm(form: { name: string; email: string; topic: ContactTopic; message: string; orderNumber?: string }) {
    await this.nameInput.fill(form.name);
    await this.emailInput.fill(form.email);
    await this.topicSelect.selectOption(form.topic);
    if (form.orderNumber) await this.orderNumberInput.fill(form.orderNumber);
    await this.messageInput.fill(form.message);
    // Commit the field so on-blur validation doesn't shift the layout during the submit click.
    await this.messageInput.blur();
  }

  async attach(file: { name: string; mimeType: string; buffer: Buffer }) {
    await this.fileInput.setInputFiles(file);
  }

  async submit() {
    await this.submitButton.click();
  }
}
