import { JSONLogger } from '@douglasneuroinformatics/libnest/logging';
import { InternalServerErrorException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/generated-client';

export const PRISMA_CLIENT_TOKEN = 'PRISMA_CLIENT';

export class PrismaFactory {
  private static logger = new JSONLogger(PrismaFactory.name, {
    debug: false,
    verbose: false
  });

  static createClient(options: Prisma.PrismaClientOptions) {
    this.logger.log('Creating PrismaClient...');
    const baseClient = new PrismaClient(options);
    const extendedClient = baseClient.$extends({
      model: {
        $allModels: {
          async exists<T extends object>(this: T, where: Prisma.Args<T, 'findFirst'>['where']): Promise<boolean> {
            const name = Reflect.get(this, '$name') as string;
            PrismaFactory.logger.debug(`Checking if instance of '${name}' exists...`);
            let result: boolean;
            try {
              const context = Prisma.getExtensionContext(this) as unknown as {
                findFirst: (...args: any[]) => Promise<unknown>;
              };
              result = (await context.findFirst({ where })) !== null;
            } catch (err) {
              PrismaFactory.logger.fatal(err);
              throw new InternalServerErrorException('Prisma Error', { cause: err });
            }
            PrismaFactory.logger.debug(`Done checking if instance of '${name}' exists: result = ${result}`);
            return result;
          }
        }
      },
      result: {
        assignmentModel: {
          __model__: {
            compute() {
              return 'Assignment';
            }
          }
        },
        groupModel: {
          __model__: {
            compute() {
              return 'Group';
            }
          }
        },
        instrumentModel: {
          __model__: {
            compute() {
              return 'Instrument';
            }
          }
        },
        instrumentRecordModel: {
          __model__: {
            compute() {
              return 'InstrumentRecord';
            }
          }
        },
        sessionModel: {
          __model__: {
            compute() {
              return 'Session';
            }
          }
        },
        subjectModel: {
          __model__: {
            compute() {
              return 'Subject';
            }
          }
        },
        userModel: {
          __model__: {
            compute() {
              return 'User';
            }
          }
        }
      }
    });
    this.logger.log('Finished creating PrismaClient');
    return extendedClient;
  }
}

export type ExtendedPrismaClient = ReturnType<typeof PrismaFactory.createClient>;
