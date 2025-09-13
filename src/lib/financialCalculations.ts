import { prisma } from "@/lib/prisma";

export interface InstallmentCalculation {
  id: string;
  title: string;
  dueDate: Date;
  shareAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  penaltyAmount: number;
  daysLate: number;
}

export interface FinancialSummary {
  totalShareAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  totalPenaltyAmount: number;
  paidPercentage: number;
}

export class FinancialCalculator {
  /**
   * Calculate installment status based on payments and due date
   */
  static calculateInstallmentStatus(
    shareAmount: number,
    paidAmount: number,
    dueDate: Date
  ): 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' {
    // Ensure we have valid numbers
    const safeShareAmount = Number(shareAmount) || 0;
    const safePaidAmount = Number(paidAmount) || 0;
    
    // If share amount is 0, always return PENDING (no payment required)
    if (safeShareAmount <= 0) {
      return 'PENDING';
    }

    // Check if fully paid first
    if (safePaidAmount >= safeShareAmount) {
      return 'PAID';
    }
    
    // Check if overdue (before checking partial payment)
    const now = new Date();
    const isOverdue = now > dueDate;
    
    // If partially paid
    if (safePaidAmount > 0) {
      // If overdue and partially paid, still show as PARTIAL (not OVERDUE)
      return 'PARTIAL';
    }
    
    // If no payment made and overdue
    if (isOverdue) {
      return 'OVERDUE';
    }
    
    // Default case: no payment made and not overdue yet
    return 'PENDING';
  }

  /**
   * Calculate penalty for overdue installments based on payment date
   */
  static calculatePenalty(
    dueDate: Date,
    paymentDate: Date,
    dailyPenaltyAmount: number,
    penaltyGraceDays: number = 0
  ): { penaltyAmount: number; daysLate: number } {
    const graceDate = new Date(dueDate);
    graceDate.setDate(graceDate.getDate() + penaltyGraceDays);
    
    // Only calculate penalty if payment was made after grace period
    if (paymentDate <= graceDate) {
      return { penaltyAmount: 0, daysLate: 0 };
    }
    
    const daysLate = Math.floor((paymentDate.getTime() - graceDate.getTime()) / (1000 * 60 * 60 * 24));
    const penaltyAmount = dailyPenaltyAmount * daysLate;
    
    return { penaltyAmount, daysLate };
  }

  /**
   * Calculate financial summary for a user's installments
   */
  static calculateFinancialSummary(installments: InstallmentCalculation[]): FinancialSummary {
    const totalShareAmount = installments.reduce((sum, inst) => sum + inst.shareAmount, 0);
    const totalPaidAmount = installments.reduce((sum, inst) => sum + inst.paidAmount, 0);
    const totalRemainingAmount = installments.reduce((sum, inst) => sum + inst.remainingAmount, 0);
    const totalPenaltyAmount = installments.reduce((sum, inst) => sum + inst.penaltyAmount, 0);
    const paidPercentage = totalShareAmount > 0 ? (totalPaidAmount / totalShareAmount) * 100 : 0;

    return {
      totalShareAmount,
      totalPaidAmount,
      totalRemainingAmount,
      totalPenaltyAmount,
      paidPercentage
    };
  }

  /**
   * Calculate user's share amount based on unit area
   */
  static calculateUserShare(
    totalProjectAmount: number,
    userUnitArea: number,
    totalProjectArea: number
  ): number {
    if (totalProjectArea === 0) return 0;
    return (totalProjectAmount * userUnitArea) / totalProjectArea;
  }

  /**
   * Apply payment to installments (handles overpayment)
   */
  static async applyPayment(
    userId: string,
    paymentAmount: number,
    paymentDate: Date,
    description?: string
  ): Promise<{ success: boolean; message: string; remainingAmount?: number; appliedPayments?: any[] }> {
    try {
      // Get user's pending installments ordered by due date
      const pendingInstallments = await prisma.userInstallment.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        },
        include: {
          installmentDefinition: true,
          payments: true
        },
        orderBy: {
          installmentDefinition: {
            dueDate: 'asc'
          }
        }
      });

      let remainingPayment = paymentAmount;
      const appliedPayments = [];

      for (const installment of pendingInstallments) {
        if (remainingPayment <= 0) break;

        const currentPaidAmount = installment.payments ? installment.payments.reduce((sum, p) => sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0), 0) : 0;
        const remainingInstallmentAmount = installment.shareAmount - currentPaidAmount;

        if (remainingInstallmentAmount > 0) {
          const paymentToApply = Math.min(remainingPayment, remainingInstallmentAmount);
          
          // Create payment record
          const payment = await prisma.payment.create({
            data: {
              userInstallmentId: installment.id,
              paymentDate,
              amount: paymentToApply,
              description
            }
          });

          appliedPayments.push({
            ...payment,
            installmentTitle: installment.installmentDefinition?.title || installment.title || `قسط ${installment.id}`
          });
          remainingPayment -= paymentToApply;

          // Update installment status
          const newPaidAmount = currentPaidAmount + paymentToApply;
          let newStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PENDING';
          
          if (newPaidAmount >= installment.shareAmount) {
            newStatus = 'PAID';
          } else if (newPaidAmount > 0) {
            newStatus = 'PARTIAL';
          }

          await prisma.userInstallment.update({
            where: { id: installment.id },
            data: { status: newStatus }
          });
        }
      }

      let message = '';
      if (appliedPayments.length > 0) {
        message = `پرداخت با موفقیت اعمال شد. ${appliedPayments.length} قسط پرداخت شد.`;
        if (remainingPayment > 0) {
          message += ` مبلغ اضافی ${new Intl.NumberFormat("fa-IR").format(remainingPayment)} ریال به قسط بعدی منتقل شد.`;
        }
      } else {
        message = 'هیچ قسطی برای پرداخت یافت نشد.';
      }

      return {
        success: true,
        message,
        remainingAmount: remainingPayment,
        appliedPayments
      };
    } catch (error) {
      console.error('Error applying payment:', error);
      return {
        success: false,
        message: 'خطا در اعمال پرداخت'
      };
    }
  }

  /**
   * Calculate and update penalties for overdue installments
   */
  static async calculateAndUpdatePenalties(
    userId: string,
    dailyPenaltyAmount: number = 0,
    penaltyGraceDays: number = 0
  ): Promise<{ updatedPenalties: number; totalPenaltyAmount: number }> {
    try {
      // Get user's penalty settings
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { dailyPenaltyAmount: true, penaltyGraceDays: true }
      });

      // Use user's settings if available, otherwise use provided parameters
      const userDailyPenaltyAmount = user?.dailyPenaltyAmount || dailyPenaltyAmount;
      const userPenaltyGraceDays = user?.penaltyGraceDays || penaltyGraceDays;

      if (userDailyPenaltyAmount <= 0) {
        return { updatedPenalties: 0, totalPenaltyAmount: 0 };
      }

      const overdueInstallments = await prisma.userInstallment.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }
        },
        include: {
          installmentDefinition: true,
          payments: true,
          penalties: true
        }
      });

      let updatedPenalties = 0;
      let totalPenaltyAmount = 0;

      for (const installment of overdueInstallments) {
        const dueDate = new Date(installment.installmentDefinition?.dueDate || installment.dueDate || new Date());
        const graceDate = new Date(dueDate);
        graceDate.setDate(graceDate.getDate() + userPenaltyGraceDays);
        
        // Only process if payment was made after grace period
        if (installment.payments && installment.payments.length > 0) {
          const latestPayment = installment.payments[installment.payments.length - 1];
          const paymentDate = new Date(latestPayment.paymentDate);
          
          if (paymentDate > graceDate) {
            const daysLate = Math.floor((paymentDate.getTime() - graceDate.getTime()) / (1000 * 60 * 60 * 24));
            const penaltyAmount = daysLate * userDailyPenaltyAmount;

            if (penaltyAmount > 0) {
              // Check if penalty already exists for this installment (only one penalty per installment)
              const existingPenalty = await prisma.penalty.findFirst({
                where: {
                  userInstallmentId: installment.id
                }
              });

              if (existingPenalty) {
                // Update existing penalty
                await prisma.penalty.update({
                  where: { id: existingPenalty.id },
                  data: {
                    daysLate,
                    dailyRate: userDailyPenaltyAmount,
                    totalPenalty: penaltyAmount
                  }
                });
                updatedPenalties++;
              } else {
                // Create new penalty
                await prisma.penalty.create({
                  data: {
                    userInstallmentId: installment.id,
                    daysLate,
                    dailyRate: userDailyPenaltyAmount,
                    totalPenalty: penaltyAmount
                  }
                });
                updatedPenalties++;
              }

              totalPenaltyAmount += penaltyAmount;
            }
          }
        }
      }

      return { updatedPenalties, totalPenaltyAmount };
    } catch (error) {
      console.error('Error calculating penalties:', error);
      return { updatedPenalties: 0, totalPenaltyAmount: 0 };
    }
  }

  /**
   * Apply payment through API endpoint
   */
  static async applyPaymentAPI(
    userId: string,
    projectId: string,
    paymentAmount: number,
    paymentDate: Date,
    description?: string
  ): Promise<{ success: boolean; message: string; remainingAmount?: number; appliedPayments?: any[] }> {
    try {
      // Verify user has access to this project
      const userUnit = await prisma.unit.findFirst({
        where: {
          userId,
          projectId
        }
      });

      if (!userUnit) {
        return {
          success: false,
          message: 'کاربر در این پروژه عضو نیست'
        };
      }

      return await this.applyPayment(userId, paymentAmount, paymentDate, description);
    } catch (error) {
      console.error('Error applying payment via API:', error);
      return {
        success: false,
        message: 'خطا در اعمال پرداخت'
      };
    }
  }

  /**
   * Get comprehensive financial report for a user
   */
  static async getUserFinancialReport(userId: string): Promise<{
    summary: FinancialSummary;
    installments: InstallmentCalculation[];
    recentPayments: any[];
    penalties: any[];
  }> {
    try {
      const userInstallments = await prisma.userInstallment.findMany({
        where: { userId },
        include: {
          installmentDefinition: true,
          payments: true,
          penalties: true
        },
        orderBy: {
          installmentDefinition: {
            dueDate: 'asc'
          }
        }
      });

      const installments: InstallmentCalculation[] = userInstallments.map(inst => {
        // Only count payments without receipt (actual installment payments)
        const paidAmount = inst.payments ? inst.payments.reduce((sum, p) => {
          return sum + (p.amount > 0 && !p.receiptImagePath ? p.amount : 0);
        }, 0) : 0;
        const remainingAmount = inst.shareAmount - paidAmount;
        const status = this.calculateInstallmentStatus(
          inst.shareAmount,
          paidAmount,
          new Date(inst.installmentDefinition?.dueDate || inst.dueDate || new Date())
        );
        const penaltyAmount = inst.penalties ? inst.penalties.reduce((sum, p) => sum + p.totalPenalty, 0) : 0;
        const daysLate = Math.max(0, Math.floor(
          (new Date().getTime() - new Date(inst.installmentDefinition?.dueDate || inst.dueDate || new Date()).getTime()) / (1000 * 60 * 60 * 24)
        ));

        return {
          id: inst.id,
          title: inst.installmentDefinition?.title || inst.title || `قسط ${inst.id}`,
          dueDate: new Date(inst.installmentDefinition?.dueDate || inst.dueDate || new Date()),
          shareAmount: inst.shareAmount,
          paidAmount,
          remainingAmount,
          status,
          penaltyAmount,
          daysLate
        };
      });

      const summary = this.calculateFinancialSummary(installments);

      const recentPayments = await prisma.payment.findMany({
        where: {
          userInstallment: { userId }
        },
        include: {
          userInstallment: {
            include: {
              installmentDefinition: true
            }
          }
        },
        orderBy: { paymentDate: 'desc' },
        take: 10
      });

      const penalties = await prisma.penalty.findMany({
        where: {
          userInstallment: { userId }
        },
        include: {
          userInstallment: {
            include: {
              installmentDefinition: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        summary,
        installments,
        recentPayments,
        penalties
      };
    } catch (error) {
      console.error('Error generating financial report:', error);
      throw error;
    }
  }
}
