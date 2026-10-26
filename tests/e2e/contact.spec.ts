import { expect, test } from '../../src/fixtures';

const MESSAGE = 'Sveiki, norėčiau pasiteirauti apie užsakymo pristatymą.';
const PNG = {
  name: 'ekrano-kopija.png',
  mimeType: 'image/png',
  // 1×1 transparent PNG
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  ),
};

test.describe('Contact form', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ contactPage }) => {
    await contactPage.goto();
  });

  test('sends a message with an attachment and shows the ticket number', { tag: '@smoke' }, async ({ contactPage }) => {
    await contactPage.fillForm({ name: 'Jonas Jonaitis', email: 'jonas@test.lt', topic: 'other', message: MESSAGE });
    await contactPage.attach(PNG);
    await expect(contactPage.fileName).toHaveText(PNG.name);

    await contactPage.submit();

    await expect(contactPage.successPanel).toBeVisible();
    await expect(contactPage.ticketNumber).toHaveText(/^KT-\d{4}$/);
  });

  test('rejects an attachment of an unsupported type', async ({ contactPage }) => {
    await contactPage.attach({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });

    await expect(contactPage.fileError).toHaveText('Leidžiami tik PNG, JPG arba PDF failai.');
    await expect(contactPage.fileName).toBeHidden();
  });

  test('rejects an attachment over 2 MB', async ({ contactPage }) => {
    await contactPage.attach({
      name: 'big.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
    });

    await expect(contactPage.fileError).toHaveText('Failas per didelis. Maksimalus dydis – 2 MB.');
  });

  test('the order number field appears only for order-related topics', async ({ contactPage }) => {
    await expect(contactPage.orderNumberInput).toBeHidden();

    await contactPage.topicSelect.selectOption('order');
    await expect(contactPage.orderNumberInput).toBeVisible();

    await contactPage.topicSelect.selectOption('account');
    await expect(contactPage.orderNumberInput).toBeHidden();
  });

  test('the character counter follows the message', async ({ contactPage }) => {
    await contactPage.messageInput.fill(MESSAGE);

    await expect(contactPage.messageCounter).toHaveText(`${MESSAGE.length} / 500`);
  });

  test('validates the form before sending', async ({ contactPage }) => {
    await contactPage.fillForm({
      name: 'J',
      email: 'jonas@',
      topic: 'order',
      orderNumber: '123',
      message: 'Per trumpa',
    });

    await contactPage.submit();

    await expect(contactPage.fieldError('name')).toHaveText('Vardas per trumpas.');
    await expect(contactPage.fieldError('email')).toHaveText('Įveskite teisingą el. pašto adresą.');
    await expect(contactPage.fieldError('order')).toHaveText('Užsakymo numerio formatas: ORD-123456.');
    await expect(contactPage.fieldError('message')).toHaveText('Žinutė turi būti bent 20 simbolių.');
    await expect(contactPage.successPanel).toBeHidden();
  });

  test('a logged-in user gets name and email prefilled', async ({ loggedInUser, contactPage }) => {
    await contactPage.goto();

    await expect(contactPage.nameInput).toHaveValue(`${loggedInUser.data.firstName} ${loggedInUser.data.lastName}`);
    await expect(contactPage.emailInput).toHaveValue(loggedInUser.data.email);
  });
});
