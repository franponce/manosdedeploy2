import mercadopago from "mercadopago";

const ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN;

if (!ACCESS_TOKEN) {
  console.error(
    "MercadoPago access token is not set in environment variables."
  );
  throw new Error("MercadoPago access token is not set.");
}

mercadopago.configure({
  access_token: ACCESS_TOKEN,
});

export default mercadopago;
