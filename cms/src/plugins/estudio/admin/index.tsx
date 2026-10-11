import { Feather } from '@strapi/icons';

const PLUGIN_ID = 'estudio';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}`,
      icon: Feather,
      intlLabel: { id: `${PLUGIN_ID}.plugin.name`, defaultMessage: 'Estudio editorial' },
      Component: () => import('./pages/Estudio'),
      permissions: [],
      position: 2,
    });
    app.registerPlugin({ id: PLUGIN_ID, name: 'Estudio editorial' });
  },
};
