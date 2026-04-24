import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('[GET /api/admin/accounts] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if email already exists in Prisma to avoid messy partial creations
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // 1. Create user in Supabase Auth (Service Role avoids confirmation email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName }
    });

    if (authError) {
      console.error('[POST /api/admin/accounts] Supabase error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // 2. Hash password for Prisma storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user in Prisma
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'admin', // Default to admin for this tab
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/admin/accounts] Error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // 1. Find user in Prisma to get the email
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // 2. Find user in Supabase by matching email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Supabase listUsers error: ${listError.message}`);
    }

    const supabaseUser = users.find(u => u.email === user.email);
    
    // 3. Delete from Supabase if found
    if (supabaseUser) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id);
      if (deleteError) {
         throw new Error(`Supabase deleteUser error: ${deleteError.message}`);
      }
    }

    // 4. Delete from Prisma
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('[DELETE /api/admin/accounts] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete account' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, firstName, lastName, password } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    
    if (password) {
       if (password.length < 8) {
          return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
       }
       updateData.password = await bcrypt.hash(password, 10);
    }

    // Update in Prisma
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // Update in Supabase
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const supabaseUser = users.find(u => u.email === user.email);
    
    if (supabaseUser) {
      const authUpdateData: any = {};
      if (password) authUpdateData.password = password;
      if (firstName || lastName) {
        authUpdateData.user_metadata = {
          ...supabaseUser.user_metadata,
          firstName: firstName || supabaseUser.user_metadata?.firstName,
          lastName: lastName || supabaseUser.user_metadata?.lastName,
        };
      }
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUser.id,
        authUpdateData
      );

      if (updateError) {
         console.error('[PATCH /api/admin/accounts] Supabase update error:', updateError);
         // Continuing despite Supabase error to return Prisma success, but ideally shouldn't fail
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('[PATCH /api/admin/accounts] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update account' }, { status: 500 });
  }
}
