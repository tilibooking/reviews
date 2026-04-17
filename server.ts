import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// --- Supabase Client ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials missing. Mocking data for now.');
      return null;
    }
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
}

// --- Data Models ---
interface Employee {
  id: string;
  name: string;
  totalReviews: number;
}

interface Review {
  id: string;
  customerName: string;
  employeeId: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// --- Mock Store (Fallback only) ---
let employees: any[] = [
  { id: 'e1', name: 'Alice Smith', totalReviews: 5 },
  { id: 'e2', name: 'Bob Jones', totalReviews: 3 },
  { id: 'e3', name: 'Charlie Dave', totalReviews: 12 },
];

let reviews: any[] = [
  { id: 'r1', customerName: 'John Doe', employeeId: 'e3', rating: 5, comment: 'Great service!', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'approved' },
  { id: 'r2', customerName: 'Jane Smith', employeeId: 'e1', rating: 4, comment: 'Very helpful.', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), status: 'approved' },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---
  
  // Get all employees
  app.get('/api/employees', async (req, res) => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await (client as any).from('employees').select('*').order('name');
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }
    const sorted = [...employees].sort((a, b) => b.totalReviews - a.totalReviews);
    res.json(sorted);
  });

  // Get all employees and calculate stats
  app.get('/api/employees/stats', async (req, res) => {
    const client = getSupabase();
    if (client) {
      // Use the view we created in Supabase
      const { data, error } = await (client as any).from('employee_stats').select('*').order('total_reviews', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      
      // Map view columns to app expected format
      const stats = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        totalReviews: item.total_reviews,
        currentWeekCount: item.current_week_count,
        currentMonthCount: item.current_month_count,
        previousWeekCount: item.previous_week_count,
        todayCount: item.today_count,
        nextPayout: item.previous_week_count * 30
      }));
      return res.json(stats);
    }

    // Mock Fallback
    const now = new Date();
    const lastSaturday = new Date(now);
    lastSaturday.setDate(now.getDate() - now.getDay() - 1);
    lastSaturday.setHours(23, 59, 59, 999);
    const previousSunday = new Date(lastSaturday);
    previousSunday.setDate(lastSaturday.getDate() - 6);
    previousSunday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const stats = employees.map(emp => {
      const empReviews = reviews.filter(r => r.employeeId === emp.id && r.status === 'approved');
      const todayReviews = empReviews.filter(r => new Date(r.createdAt) >= startOfDay);
      const previousWeekReviews = empReviews.filter(r => new Date(r.createdAt) >= previousSunday && new Date(r.createdAt) <= lastSaturday);
      const currentWeekReviews = empReviews.filter(r => new Date(r.createdAt) >= startOfWeek);
      const currentMonthReviews = empReviews.filter(r => new Date(r.createdAt) >= startOfMonth);
      const nextPayout = previousWeekReviews.length * 30;

      return {
        ...emp,
        todayCount: todayReviews.length,
        previousWeekCount: previousWeekReviews.length,
        currentWeekCount: currentWeekReviews.length,
        currentMonthCount: currentMonthReviews.length,
        nextPayout
      };
    });
    
    stats.sort((a, b) => b.totalReviews - a.totalReviews);
    res.json(stats);
  });

  // Get all approved reviews for a specific employee
  app.get('/api/employees/:id/reviews', async (req, res) => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await (client as any)
        .from('reviews')
        .select('*')
        .eq('employee_id', req.params.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json((data || []).map((r: any) => ({ ...r, employeeId: r.employee_id, createdAt: r.created_at })));
    }
    const empReviews = reviews.filter(r => r.employeeId === req.params.id && r.status === 'approved');
    res.json(empReviews);
  });
  
  // Get recent approved reviews to display globally
  app.get('/api/reviews/recent', async (req, res) => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await (client as any)
        .from('reviews')
        .select('*, employees(name)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) return res.status(500).json({ error: error.message });
      
      const enriched = (data || []).map((r: any) => ({
        id: r.id,
        customerName: r.customer_name,
        employeeId: r.employee_id,
        employeeName: r.employees?.name || 'Unknown',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        status: r.status
      }));
      return res.json(enriched);
    }

    const recent = reviews
      .filter(r => r.status === 'approved')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    
    const enriched = recent.map(r => ({
      ...r,
      employeeName: employees.find(e => e.id === r.employeeId)?.name || 'Unknown'
    }));
    res.json(enriched);
  });

  // Submit a new review 
  app.post('/api/reviews', async (req, res) => {
    const { customerName, employeeId, rating, comment } = req.body;
    
    if (!customerName || !employeeId || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = getSupabase();
    if (client) {
      const { data, error } = await (client as any)
        .from('reviews')
        .insert([{
          customer_name: customerName,
          employee_id: employeeId,
          rating: Number(rating),
          comment: comment || '',
          status: 'pending'
        }])
        .select()
        .single();
      
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }

    const newReview: Review = {
      id: `r${Date.now()}`,
      customerName,
      employeeId,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    reviews.push(newReview);
    res.status(201).json(newReview);
  });

  // --- Admin Routes ---
  const ADMIN_PIN = '1247';
  
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pin = req.headers['x-admin-pin'];
    if (pin !== ADMIN_PIN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Get all reviews (for moderation)
  app.get('/api/admin/reviews', adminAuth, async (req, res) => {
    const client = getSupabase();
    if (client) {
      const { data, error } = await (client as any)
        .from('reviews')
        .select('*, employees(name)')
        .order('created_at', { ascending: false });
      
      if (error) return res.status(500).json({ error: error.message });
      
      const enriched = (data || []).map((r: any) => ({
        id: r.id,
        customerName: r.customer_name,
        employeeId: r.employee_id,
        employeeName: r.employees?.name || 'Unknown',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
        status: r.status
      }));
      return res.json(enriched);
    }

    const enriched = reviews.map(r => ({
      ...r,
      employeeName: employees.find(e => e.id === r.employeeId)?.name || 'Unknown'
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(enriched);
  });

  // Moderate a review (approve/reject)
  app.patch('/api/admin/reviews/:id', adminAuth, async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const client = getSupabase();
    if (client) {
      const { data, error } = await (client as any)
        .from('reviews')
        .update({ status })
        .eq('id', req.params.id)
        .select()
        .single();
      
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data);
    }

    const review = reviews.find(r => r.id === req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });
    review.status = status;
    res.json(review);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
