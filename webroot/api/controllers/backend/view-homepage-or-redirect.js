module.exports = {
  friendlyName: 'View homepage or redirect',
  description: 'Display or redirect to the appropriate homepage, depending on login status.',
  exits: {
    success: {
      statusCode: 200,
      viewTemplatePath: 'backend/pages/homepage.ejs'
    },
    redirect: {
      responseType: 'redirect',
      description: 'Requesting user is logged in, so redirect to the internal welcome page.'
    },
  },

  fn: async function (inputs, exits) {
    if (this.req.me) {
      throw { redirect:'/backend/dashboard' };
    } else {
      throw { redirect: '/backend/login'};
    }
    return exits.success();
  }
};