function requireGeneralFinanceAccess(req, res, next) {
  if (req.admin?.permissions?.canViewGeneralFinance) {
    return next();
  }

  return res.status(403).json({
    message: "Sem permissao para acessar o Financeiro Geral.",
  });
}

module.exports = requireGeneralFinanceAccess;
