import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpStatus, HttpCode,
  Query, UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      const product = await this.productService.create(createProductDto);
      return { success: true, message: 'Product created successfully', data: product };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to create product', data: null };
    }
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) throw new BadRequestException('No image file provided');
      const imageUrl = await this.productService.uploadImage(file);
      return { success: true, message: 'Image uploaded successfully', data: { imageUrl } };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to upload image', data: null };
    }
  }

  @Get()
  async findAll() {
    try {
      const products = await this.productService.findAll();
      return { success: true, message: 'Products retrieved successfully', data: products };
    } catch (error) {
      return { success: false, message: 'Failed to fetch products', data: [] };
    }
  }

  @Get('by-store')
  async findByStore(@Query('store') storeId: string) {
    try {
      const products = await this.productService.findByStore(storeId);
      return { success: true, message: `Products from ${storeId} store retrieved successfully`, data: products };
    } catch (error) {
      return { success: false, message: 'Failed to fetch products by store', data: [] };
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const product = await this.productService.findOne(id);
      return { success: true, message: 'Product retrieved successfully', data: product };
    } catch (error) {
      return { success: false, message: 'Failed to fetch product details', data: null };
    }
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productService.update(id, updateProductDto);
      return { success: true, message: 'Product updated successfully', data: product };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to update product', data: null };
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const product = await this.productService.remove(id);
      return { success: true, message: 'Product deleted successfully', data: product };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to delete product', data: null };
    }
  }
}
