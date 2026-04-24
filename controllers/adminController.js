const getAdminProfile = async (req, res) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (_error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAdminProfile,
};
