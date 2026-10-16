import {BaseClient} from './server';
export class AppointmentClient extends BaseClient {
  constructor(token) {
    super(undefined, token);
  }
  async fetchAll(optionalHeader) {
    // get all user
    const res = await this.get('appointment', optionalHeader);
    return res;
  }
  fetchPage(page = 1, limit = 100) {
    return this.get(`appointment?page=${page}&limit=${limit}`);
  }
  async fetchByQuery(query, value, optionalHeader) {
    // get all user
    const res = await this.get(`appointment?${query}=${value}`, optionalHeader);
    return res;
  }
  async fetchOne(id, optionalHeader) {
    const res = await this.get('appointment/' + id, optionalHeader);
    return res;
  }
  async create(data, optionalHeader) {
    const res = await this.post('appointment/create', data, optionalHeader);
    return res;
  }
  async update(data, optionalHeader) {
    const { _id, id, ...values } = data;
    const res = await this.patch('appointment/' + (_id || id), values, optionalHeader);
    return res;
  }
  async deleteOne(id, optionalHeader) {
    const res = await this.request('appointment/' + id, 'DELETE', undefined, optionalHeader);
    return res;
  }
}

