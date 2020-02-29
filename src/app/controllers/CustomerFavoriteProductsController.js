const CustomerFavoriteProducts = require('../../app/models/CustomerFavoriteProducts');

class CustomerFavoriteProductsController {
  async store(req, res) {
    const customer = req.customer;
    const product = req.product;

    const checkProductAlreadyExists = await CustomerFavoriteProducts.findOne({
      where: { customer_id: customer.id, product_id: product.id },
    });

    console.log(checkProductAlreadyExists);

    if (checkProductAlreadyExists) {
      console.log('uigob  y8o');
      return res.status(400).json({
        error: true,
        message: 'The product already exists on the customers favorite list!',
      });
    }

    const favoriteProduct = await CustomerFavoriteProducts.create({
      customer_id: customer.id,
      product_id: product.id,
    });
    return res.status(201).json(favoriteProduct);
  }

  async destroy(req, res) {
    const customer = req.customer;
    const product = req.product;

    await CustomerFavoriteProducts.destroy({
      where: { customer_id: customer.id, product_id: product.id },
    });

    return res.status(200).send();
  }
}

module.exports = new CustomerFavoriteProductsController();