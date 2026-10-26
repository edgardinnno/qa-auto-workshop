import { expect, test } from '../../src/fixtures';
import type { LoginResponse } from '../../src/api/types';
import { birthDateYearsAgo, buildUser } from '../../src/data/factories';
import type { RegisterField, RegistrationForm } from '../../src/pages/RegisterPage';
import { parseOk } from '../../src/utils/api-assertions';

test.describe('Registration', { tag: '@e2e' }, () => {
  test.beforeEach(async ({ registerPage }) => {
    await registerPage.goto();
  });

  test(
    'TC-175: a new user registers and is sent to login',
    { tag: '@smoke' },
    async ({ registerPage, loginPage, api, page }) => {
      const user = buildUser();

      await registerPage.register(user);

      await expect(page).toHaveURL(/login\.html$/);
      await expect(loginPage.infoAlert).toHaveText('Registracija sėkminga! Dabar galite prisijungti.');
      await expect(loginPage.emailInput).toHaveValue(user.email);

      await test.step('cleanup: delete the account created through the UI', async () => {
        const { token } = await parseOk<LoginResponse>(await api.auth.login(user.email, user.password));
        expect((await api.withToken(token).users.deleteMe()).status()).toBe(204);
      });
    },
  );

  test('TC-176: an already registered email is rejected by the server', async ({ registerPage, testUser }) => {
    await registerPage.register(buildUser({ email: testUser.data.email }));

    await expect(registerPage.errorAlert).toHaveText('Vartotojas su šiuo el. pašto adresu jau užregistruotas.');
    await expect(registerPage.fieldError('email')).toHaveText('Šis el. pašto adresas jau užimtas.');
  });

  test('TC-177: submitting an empty form flags every required field', async ({ registerPage }) => {
    await registerPage.submit();

    const required: [RegisterField, string][] = [
      ['first-name', 'Įveskite vardą.'],
      ['last-name', 'Įveskite pavardę.'],
      ['birth-date', 'Įveskite gimimo datą.'],
      ['country', 'Pasirinkite šalį.'],
      ['email', 'Įveskite el. pašto adresą.'],
      ['password', 'Įveskite slaptažodį.'],
      ['password-confirm', 'Pakartokite slaptažodį.'],
      ['terms', 'Turite sutikti su naudojimosi taisyklėmis.'],
    ];
    for (const [field, message] of required) {
      await expect(registerPage.fieldError(field), field).toHaveText(message);
    }
    await expect(registerPage.firstNameInput).toBeFocused();
  });

  const invalidCases: {
    id: string;
    name: string;
    form: Partial<RegistrationForm>;
    field: RegisterField;
    message: string;
  }[] = [
    {
      id: 'TC-178',
      name: 'one-letter first name',
      form: { firstName: 'A' },
      field: 'first-name',
      message: 'Vardas turi būti bent 2 simbolių.',
    },
    {
      id: 'TC-179',
      name: 'digits in last name',
      form: { lastName: 'Jonaitis2' },
      field: 'last-name',
      message: 'Pavardėje gali būti tik raidės.',
    },
    {
      id: 'TC-180',
      name: 'malformed email',
      form: { email: 'jonas@' },
      field: 'email',
      message: 'Įveskite teisingą el. pašto adresą.',
    },
    {
      id: 'TC-181',
      name: 'phone in wrong format',
      form: { phone: '860000000' },
      field: 'phone',
      message: 'Telefono formatas: +370XXXXXXXX.',
    },
    {
      id: 'TC-182',
      name: 'younger than 18',
      form: { birthDate: birthDateYearsAgo(17) },
      field: 'birth-date',
      message: 'Registruotis gali tik asmenys nuo 18 metų.',
    },
    {
      id: 'TC-183',
      name: 'password without a special character',
      form: { password: 'Testas1234' },
      field: 'password',
      message: 'Slaptažodyje turi būti bent vienas specialusis simbolis (pvz. ! @ #).',
    },
    {
      id: 'TC-184',
      name: 'passwords do not match',
      form: { passwordConfirm: 'Kitas123!' },
      field: 'password-confirm',
      message: 'Slaptažodžiai nesutampa.',
    },
    {
      id: 'TC-185',
      name: 'terms not accepted',
      form: { acceptTerms: false },
      field: 'terms',
      message: 'Turite sutikti su naudojimosi taisyklėmis.',
    },
  ];

  for (const { id, name, form, field, message } of invalidCases) {
    test(`${id}: shows a validation error: ${name}`, async ({ registerPage, page }) => {
      await registerPage.register({ ...buildUser(), ...form });

      await expect(registerPage.fieldError(field)).toHaveText(message);
      await expect(page).toHaveURL(/register\.html$/);
    });
  }

  test('TC-186: the password meter reflects which rules are met', async ({ registerPage }) => {
    await registerPage.passwordInput.fill('abc');
    await expect(registerPage.passwordRule('lower')).toHaveAttribute('data-met', 'true');
    await expect(registerPage.passwordRule('length')).toHaveAttribute('data-met', 'false');
    await expect(registerPage.passwordStrengthLabel).toHaveText('Silpnas');

    await registerPage.passwordInput.fill('Testas123!');
    for (const rule of ['length', 'upper', 'lower', 'digit', 'special'] as const) {
      await expect(registerPage.passwordRule(rule)).toHaveAttribute('data-met', 'true');
    }
    await expect(registerPage.passwordStrengthLabel).toHaveText('Stiprus');
  });
});
