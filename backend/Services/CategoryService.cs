using System.Collections.Generic;
using YoutubeDownloader.Data.Interfaces;
using YoutubeDownloader.Models;
using YoutubeDownloader.Services.Interfaces;

namespace YoutubeDownloader.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public List<CategoryDetailModel> GetCategories()
        {
            return _categoryRepository.GetAllWithCount();
        }

        public bool AddCategory(string name)
        {
            return _categoryRepository.Add(name);
        }

        public bool RenameCategory(string oldName, string newName)
        {
            return _categoryRepository.Rename(oldName, newName);
        }

        public bool DeleteCategory(string name)
        {
            return _categoryRepository.Delete(name);
        }
    }
}
