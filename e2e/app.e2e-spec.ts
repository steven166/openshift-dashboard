import { OpenshiftDashboardPage } from './app.po';

describe('openshift-dashboard App', () => {
  let page: OpenshiftDashboardPage;

  beforeEach(() => {
    page = new OpenshiftDashboardPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
