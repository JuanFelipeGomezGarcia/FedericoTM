import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Check password
    const isValid = await bcrypt.compare(password, await bcrypt.hash(ADMIN_PASSWORD, 10))

    if (password === ADMIN_PASSWORD) {
      // Generate JWT token
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '24h' })

      return NextResponse.json({ token, message: 'Login successful' })
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 })
  }
}