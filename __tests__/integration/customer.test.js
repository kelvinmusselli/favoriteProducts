const request = require('supertest');
const app = require('../../src/app');
const jwt = require('jsonwebtoken');
const { generateFakeCustomer } = require('../utils/faker');
const Customer = require('../../src/app/models/Customer');
const authConfig = require('../../src/config/auth');

describe('Customer tests', () => {
  let token;

  beforeAll(() => {
    token = jwt.sign(
      {
        username: 'LuizaLabsUser',
        password: 'LuizaLabsPassword',
      },
      authConfig.secret,
      {
        expiresIn: authConfig.expiresIn,
      }
    );
  });

  afterEach(async () => {
    await Customer.destroy({ truncate: { cascade: true } });
  });

  it('should add a new customer and return status 201 (store)', async () => {
    const response = await request(app)
      .post('/customers')
      .set('authorization', `Baerer ${token}`)
      .send(generateFakeCustomer());
    expect(response.status).toBe(201);
  });
  it('should return status 400 if email is duplicated (store)', async () => {
    const fakeCustomer = generateFakeCustomer();
    await Customer.create(fakeCustomer);
    const response = await request(app)
      .post('/customers')
      .set('authorization', `Baerer ${token}`)
      .send(fakeCustomer);
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Duplicated email');
  });
  it('should return status 400 in case of error (store)', async () => {
    const response = await request(app)
      .post('/customers')
      .set('authorization', `Baerer ${token}`)
      .send({ name: 'teste' });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Error registering customer');
  });

  it('should return a customer (show)', async () => {
    const fakeCustomer = generateFakeCustomer();
    const customer = await Customer.create(fakeCustomer);
    const response = await request(app)
      .get(`/customers/${customer.id}`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.body).toHaveProperty('id');
  });
  it('should return status 404 when customer not Exists (show)', async () => {
    const fakeCustomer = generateFakeCustomer();
    const customer = await Customer.create(fakeCustomer);

    await customer.destroy();
    const response = await request(app)
      .get(`/customers/${customer.id}`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Customer not found!');
  });

  it('should update a customer (update)', async () => {
    let fakeCustomer = generateFakeCustomer();
    let newFakeCustomer = generateFakeCustomer();
    const customer = await Customer.create(fakeCustomer);

    const response = await request(app)
      .put(`/customers/${customer.id}`)
      .set('authorization', `Baerer ${token}`)
      .send(newFakeCustomer);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('email');
    expect(response.body.name).toBe(newFakeCustomer.name);
    expect(response.body.email).toBe(newFakeCustomer.email);
  });
  it('should return status 400 if email is duplicated (update)', async () => {
    let fakeCustomer = generateFakeCustomer();
    let secondFakeCustomer = generateFakeCustomer();
    await Customer.create(secondFakeCustomer);
    const customer = await Customer.create(fakeCustomer);

    const response = await request(app)
      .put(`/customers/${customer.id}`)
      .set('authorization', `Baerer ${token}`)
      .send({ name: fakeCustomer.name, email: secondFakeCustomer.email });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Duplicated email');
  });
  it('should return status 404 when customer dont exists (update)', async () => {
    const fakeCustomer = generateFakeCustomer();
    const secondFakeCustomer = generateFakeCustomer();
    const customer = await Customer.create(fakeCustomer);
    await customer.destroy();
    const response = await request(app)
      .put(`/customers/${customer.id}`)
      .set('authorization', `Baerer ${token}`)
      .send(secondFakeCustomer);
    expect(response.status).toBe(404);
  });

  it('should delete a customer (destroy)', async () => {
    let fakeCustomer = generateFakeCustomer();
    const customer = await Customer.create(fakeCustomer);
    const response = await request(app)
      .delete(`/customers/${customer.id}`)
      .set('authorization', `Baerer ${token}`)
      .send();
    const customerAfterDestroy = await Customer.findOne({
      where: { email: customer.email },
    });
    expect(response.status).toBe(200);
    expect(customerAfterDestroy).toBeNull();
  });
  it('should return status 404 when customer not Exists (destroy)', async () => {
    const fakeCustomer = generateFakeCustomer();
    const customer = await Customer.create(fakeCustomer);

    await customer.destroy();
    const response = await request(app)
      .delete(`/customers/${customer.id}`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.status).toBe(404);
  });

  it('should return a list of customers (index)', async () => {
    const response = await request(app)
      .get(`/customers`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('perPage');
    expect(response.body).toHaveProperty('lastPage');
    expect(response.body).toHaveProperty('total');
  });
  it('should return page 1 in case of not sended page query (index)', async () => {
    const response = await request(app)
      .get(`/customers`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.status).toBe(200);
    expect(response.body.page).toBe(1);
  });
  it('should return perPage 10 in case of not sended perPage query (index)', async () => {
    const response = await request(app)
      .get(`/customers`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.status).toBe(200);
    expect(response.body.perPage).toBe(10);
  });
  it('should be able return differents pages (index)', async () => {
    const response = await request(app)
      .get(`/customers?page=2`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.status).toBe(200);
    expect(parseInt(response.body.page)).toBe(2);
  });
  it('should be able return differents perPages (index)', async () => {
    const response = await request(app)
      .get(`/customers?perPage=5`)
      .set('authorization', `Baerer ${token}`)
      .send();
    expect(response.status).toBe(200);
    expect(parseInt(response.body.perPage)).toBe(5);
  });
});
