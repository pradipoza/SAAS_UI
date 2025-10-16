export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied. Admin role required.' })
    return
  }
  next()
}

export const requireClient = (req, res, next) => {
  if (req.user.role !== 'CLIENT') {
    res.status(403).json({ error: 'Access denied. Client role required.' })
    return
  }
  next()
}